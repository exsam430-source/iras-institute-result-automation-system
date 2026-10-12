import { useState, useRef } from 'react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { GRADE_COLORS } from '../../../utils/constants';
import api from '../../../utils/axios';
import toast from 'react-hot-toast';

const MarksEntryTable = ({
  assignmentId,
  entries,
  assignment,
  canEnterMidterm,
  canEnterFinals,
  isReadOnly,
  onRefresh,
  awardList,
}) => {
  const [midTermMarks, setMidTermMarks] = useState({});
  const [internalMarks, setInternalMarks] = useState({});
  const [finalTermMarks, setFinalTermMarks] = useState({});
  const [savingMidterm, setSavingMidterm] = useState(false);
  const [savingFinals, setSavingFinals] = useState(false);
  const [confirmMidterm, setConfirmMidterm] = useState(false);
  const [confirmFinals, setConfirmFinals] = useState(false);
  const [errors, setErrors] = useState({});
  const tableRef = useRef(null);

  const maxMid = assignment.course?.marksDistribution?.midTerm || 20;
  const maxInt = assignment.course?.marksDistribution?.internal || 20;
  const maxFin = assignment.course?.marksDistribution?.finalTerm || 60;

  const status = assignment.status;

  // ─── VALIDATION ───────────────────────────────────────────
  const validateField = (value, max, studentId, field) => {
    const newErrors = { ...errors };
    const key = `${studentId}-${field}`;

    if (value === '' || value === null || value === undefined) {
      delete newErrors[key];
      setErrors(newErrors);
      return true;
    }

    const num = parseFloat(value);
    if (isNaN(num)) {
      newErrors[key] = 'Invalid number';
      setErrors(newErrors);
      return false;
    }
    if (num < 0) {
      newErrors[key] = 'Cannot be negative';
      setErrors(newErrors);
      return false;
    }
    if (num > max) {
      newErrors[key] = `Max is ${max}`;
      setErrors(newErrors);
      return false;
    }

    delete newErrors[key];
    setErrors(newErrors);
    return true;
  };

  const handleMidTermChange = (studentId, value) => {
    validateField(value, maxMid, studentId, 'mid');
    setMidTermMarks((prev) => ({ ...prev, [studentId]: value }));
  };

  const handleInternalChange = (studentId, value) => {
    validateField(value, maxInt, studentId, 'int');
    setInternalMarks((prev) => ({ ...prev, [studentId]: value }));
  };

  const handleFinalTermChange = (studentId, value) => {
    validateField(value, maxFin, studentId, 'fin');
    setFinalTermMarks((prev) => ({ ...prev, [studentId]: value }));
  };

  // ─── COUNT VALID ENTRIES ──────────────────────────────────
  const newMidTermCount = Object.keys(midTermMarks).filter(
    (id) => midTermMarks[id] !== '' && !isNaN(parseFloat(midTermMarks[id]))
  ).length;

  const alreadyMidTermEntered = entries.filter(
    (e) => e.midTermEntered && midTermMarks[e.studentId] === undefined
  ).length;

  const totalMidTermEntered = newMidTermCount + alreadyMidTermEntered;

  const newFinalsCount = Object.keys(internalMarks).filter(
    (id) => internalMarks[id] !== '' && !isNaN(parseFloat(internalMarks[id]))
  ).length;

  const midTermEnteredCount = entries.filter((e) => e.midTermEntered).length;
  const finalsEnteredCount = entries.filter((e) => e.finalTermEntered).length;

  const handleSaveMidTerm = async () => {
  const hasErrors = Object.keys(errors).some((k) => k.includes('-mid'));
  if (hasErrors) {
    toast.error('Please fix validation errors before saving');
    return;
  }

  const marksData = [];
  entries.forEach((entry) => {
    const val = midTermMarks[entry.studentId];
    if (val !== undefined && val !== '' && !isNaN(parseFloat(val))) {
      marksData.push({
        studentId: entry.studentId,
        marks: parseFloat(val),
      });
    }
  });

  if (marksData.length === 0) {
    toast.error('Please enter mid-term marks for at least one student');
    return;
  }

  setSavingMidterm(true);
  try {
    await api.patch(
      `/marks/assignment/${assignmentId}/save-midterm`,
      { marksData }
    );

    toast.success(
      `✅ Mid-term marks saved! Now enter Internal & Final marks below.`,
      { duration: 5000 }
    );

    setMidTermMarks({});
    setErrors({});
    setConfirmMidterm(false);

    // ✅ This triggers re-mount via key prop change
    await onRefresh();

  } catch (err) {
    toast.error(err.response?.data?.message || 'Failed to save mid-term marks');
  } finally {
    setSavingMidterm(false);
  }
};

  // ─── SAVE FINALS ──────────────────────────────────────────
  const handleSaveFinals = async () => {
    const hasErrors = Object.keys(errors).some(
      (k) => k.includes('-int') || k.includes('-fin')
    );
    if (hasErrors) {
      toast.error('Please fix validation errors before saving');
      return;
    }

    const marksData = [];
    entries.forEach((entry) => {
      const intVal = internalMarks[entry.studentId];
      const finVal = finalTermMarks[entry.studentId];

      const intNum =
        intVal !== undefined && intVal !== ''
          ? parseFloat(intVal)
          : entry.internalEntered
          ? entry.internalMarks
          : null;

      const finNum =
        finVal !== undefined && finVal !== ''
          ? parseFloat(finVal)
          : entry.finalTermEntered
          ? entry.finalTermMarks
          : null;

      // Only include if at least one NEW value was entered
      const hasNewInt = intVal !== undefined && intVal !== '';
      const hasNewFin = finVal !== undefined && finVal !== '';

      if (
        intNum !== null &&
        finNum !== null &&
        !isNaN(intNum) &&
        !isNaN(finNum) &&
        (hasNewInt || hasNewFin)
      ) {
        marksData.push({
          studentId: entry.studentId,
          internalMarks: intNum,
          finalTermMarks: finNum,
        });
      }
    });

    if (marksData.length === 0) {
      toast.error(
        'Please enter internal and final marks for at least one student'
      );
      return;
    }

    setSavingFinals(true);
    try {
      const res = await api.patch(
        `/marks/assignment/${assignmentId}/save-finals`,
        { marksData }
      );

      const updated = res.data.data?.results?.updated?.length || marksData.length;
      toast.success(
        `✅ Finals saved for ${updated} student(s)! Grades calculated. Students notified. Click "Send to HoD" to submit.`,
        { duration: 6000 }
      );

      // Clear finals state
      setInternalMarks({});
      setFinalTermMarks({});
      setConfirmFinals(false);

      // ✅ KEY FIX: Refresh to update status to finals-saved
      await onRefresh();
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Failed to save finals marks'
      );
    } finally {
      setSavingFinals(false);
    }
  };

  // ─── DETERMINE WHAT TO SHOW PER ROW ──────────────────────
  const getRowConfig = (entry) => {
    const isRejected = status === 'rejected';

    // Mid-term: show input if not yet entered AND canEnterMidterm
    const showMidInput =
      canEnterMidterm && !isReadOnly && !entry.midTermEntered;

    // Mid-term: show value if entered
    const showMidValue = entry.midTermEntered || isReadOnly;

    // Finals: show input if:
    // - midterm is entered for this student
    // - canEnterFinals is true
    // - not read-only
    const showFinInput =
      canEnterFinals &&
      !isReadOnly &&
      entry.midTermEntered &&
      (isRejected || !entry.finalTermEntered);

    // Finals: show value if entered and not in edit mode
    const showFinValue =
      isReadOnly ||
      (!isRejected && entry.finalTermEntered && !showFinInput);

    return { showMidInput, showMidValue, showFinInput, showFinValue };
  };

  return (
    <>
      <Card padding={false}>
        {/* ─── TABLE HEADER ───────────────────────────────── */}
        <div className="px-4 py-3 border-b border-gray-100 dark:border-dark-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Award List
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {entries.length} students enrolled •{' '}
              Mid-term: {midTermEnteredCount}/{entries.length} •{' '}
              Finals: {finalsEnteredCount}/{entries.length}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Save Mid-Term Button */}
            {canEnterMidterm && !isReadOnly && entries.some((e) => !e.midTermEntered) && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  if (newMidTermCount === 0) {
                    toast.error('Enter marks for at least one student first');
                    return;
                  }
                  setConfirmMidterm(true);
                }}
                disabled={newMidTermCount === 0}
              >
                Save Mid-Term ({newMidTermCount}/{entries.filter((e) => !e.midTermEntered).length} new)
              </Button>
            )}

            {/* Save Finals Button */}
            {canEnterFinals && !isReadOnly && (
              <Button
                size="sm"
                variant="gold"
                onClick={() => {
                  if (newFinalsCount === 0) {
                    toast.error('Enter internal and final marks first');
                    return;
                  }
                  setConfirmFinals(true);
                }}
                disabled={newFinalsCount === 0}
              >
                Save Finals ({newFinalsCount} new)
              </Button>
            )}
          </div>
        </div>

        {/* ─── TABLE ──────────────────────────────────────── */}
        <div className="overflow-x-auto" ref={tableRef}>
          <table className="w-full text-sm min-w-[900px]">
            <thead className="bg-gray-50 dark:bg-dark-card sticky top-0 z-10">
              <tr>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase w-10">
                  S#
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">
                  Roll No
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">
                  Student Name
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">
                  Father Name
                </th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase w-28">
                  Mid /{maxMid}
                  {canEnterMidterm && !isReadOnly && entries.some((e) => !e.midTermEntered) && (
                    <span className="block text-[10px] text-blue-500 font-normal normal-case">
                      ← Enter here
                    </span>
                  )}
                </th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase w-28">
                  Int /{maxInt}
                  {canEnterFinals && !isReadOnly && (
                    <span className="block text-[10px] text-amber-500 font-normal normal-case">
                      ← Enter here
                    </span>
                  )}
                </th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase w-28">
                  Final /{maxFin}
                  {canEnterFinals && !isReadOnly && (
                    <span className="block text-[10px] text-amber-500 font-normal normal-case">
                      ← Enter here
                    </span>
                  )}
                </th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase w-20">
                  Total
                </th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase w-16">
                  %
                </th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase w-16">
                  Grade
                </th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase w-16">
                  Result
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-dark-border/50">
              {entries.map((entry) => {
                const { showMidInput, showMidValue, showFinInput, showFinValue } =
                  getRowConfig(entry);

                const midErr = errors[`${entry.studentId}-mid`];
                const intErr = errors[`${entry.studentId}-int`];
                const finErr = errors[`${entry.studentId}-fin`];

                return (
                  <tr
                    key={entry.studentId}
                    className="hover:bg-gray-50/50 dark:hover:bg-dark-card/30 transition-colors"
                  >
                    <td className="px-3 py-2 text-gray-500 text-center text-xs">
                      {entry.serialNo}
                    </td>
                    <td className="px-3 py-2">
                      <span className="font-mono text-xs font-medium text-primary-600 dark:text-primary-400">
                        {entry.rollNumber}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-medium text-gray-900 dark:text-white text-sm">
                      {entry.studentName}
                    </td>
                    <td className="px-3 py-2 text-gray-500 dark:text-gray-400 text-sm hidden md:table-cell">
                      {entry.fatherName}
                    </td>

                    {/* ─── MID-TERM ─── */}
                    <td className="px-2 py-1.5 text-center">
                      {showMidInput ? (
                        <div>
                          <input
                            type="number"
                            min="0"
                            max={maxMid}
                            step="0.5"
                            value={midTermMarks[entry.studentId] ?? ''}
                            onChange={(e) =>
                              handleMidTermChange(entry.studentId, e.target.value)
                            }
                            className={`w-full px-2 py-1.5 text-center text-sm rounded-lg border transition-colors focus:outline-none focus:ring-2 ${
                              midErr
                                ? 'border-red-400 bg-red-50 dark:bg-red-900/10 focus:ring-red-500/40'
                                : 'border-primary-300 dark:border-primary-700 bg-primary-50/30 dark:bg-primary-900/10 focus:ring-primary-500/40 focus:border-primary-500'
                            } text-gray-900 dark:text-white`}
                            placeholder="0"
                          />
                          {midErr && (
                            <p className="text-[10px] text-red-500 mt-0.5">
                              {midErr}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span
                          className={`font-semibold text-sm ${
                            entry.midTermEntered
                              ? 'text-gray-900 dark:text-white'
                              : 'text-gray-300 dark:text-gray-600'
                          }`}
                        >
                          {entry.midTermEntered ? entry.midTermMarks : '—'}
                          {entry.midTermEntered && (
                            <span className="text-[10px] text-gray-400 ml-1">
                              🔒
                            </span>
                          )}
                        </span>
                      )}
                    </td>

                    {/* ─── INTERNAL ─── */}
                    <td className="px-2 py-1.5 text-center">
                      {showFinInput ? (
                        <div>
                          <input
                            type="number"
                            min="0"
                            max={maxInt}
                            step="0.5"
                            value={
                              internalMarks[entry.studentId] ??
                              (entry.internalEntered ? entry.internalMarks : '')
                            }
                            onChange={(e) =>
                              handleInternalChange(entry.studentId, e.target.value)
                            }
                            className={`w-full px-2 py-1.5 text-center text-sm rounded-lg border transition-colors focus:outline-none focus:ring-2 ${
                              intErr
                                ? 'border-red-400 bg-red-50 dark:bg-red-900/10 focus:ring-red-500/40'
                                : 'border-amber-300 dark:border-amber-700 bg-amber-50/30 dark:bg-amber-900/10 focus:ring-amber-500/40 focus:border-amber-500'
                            } text-gray-900 dark:text-white`}
                            placeholder="0"
                          />
                          {intErr && (
                            <p className="text-[10px] text-red-500 mt-0.5">
                              {intErr}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span
                          className={`font-semibold text-sm ${
                            entry.internalEntered
                              ? 'text-gray-900 dark:text-white'
                              : 'text-gray-300 dark:text-gray-600'
                          }`}
                        >
                          {entry.internalEntered ? entry.internalMarks : '—'}
                        </span>
                      )}
                    </td>

                    {/* ─── FINAL TERM ─── */}
                    <td className="px-2 py-1.5 text-center">
                      {showFinInput ? (
                        <div>
                          <input
                            type="number"
                            min="0"
                            max={maxFin}
                            step="0.5"
                            value={
                              finalTermMarks[entry.studentId] ??
                              (entry.finalTermEntered ? entry.finalTermMarks : '')
                            }
                            onChange={(e) =>
                              handleFinalTermChange(entry.studentId, e.target.value)
                            }
                            className={`w-full px-2 py-1.5 text-center text-sm rounded-lg border transition-colors focus:outline-none focus:ring-2 ${
                              finErr
                                ? 'border-red-400 bg-red-50 dark:bg-red-900/10 focus:ring-red-500/40'
                                : 'border-amber-300 dark:border-amber-700 bg-amber-50/30 dark:bg-amber-900/10 focus:ring-amber-500/40 focus:border-amber-500'
                            } text-gray-900 dark:text-white`}
                            placeholder="0"
                          />
                          {finErr && (
                            <p className="text-[10px] text-red-500 mt-0.5">
                              {finErr}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span
                          className={`font-semibold text-sm ${
                            entry.finalTermEntered
                              ? 'text-gray-900 dark:text-white'
                              : 'text-gray-300 dark:text-gray-600'
                          }`}
                        >
                          {entry.finalTermEntered ? entry.finalTermMarks : '—'}
                        </span>
                      )}
                    </td>

                    {/* ─── TOTAL ─── */}
                    <td className="px-3 py-2 text-center font-bold text-gray-900 dark:text-white text-sm">
                      {entry.totalMarks != null ? entry.totalMarks : '—'}
                    </td>

                    {/* ─── PERCENTAGE ─── */}
                    <td className="px-3 py-2 text-center text-gray-700 dark:text-gray-300 text-sm">
                      {entry.percentage != null ? `${entry.percentage}%` : '—'}
                    </td>

                    {/* ─── GRADE ─── */}
                    <td className="px-3 py-2 text-center">
                      {entry.grade ? (
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
                            GRADE_COLORS[entry.grade] || ''
                          }`}
                        >
                          {entry.grade}
                        </span>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-600 text-sm">
                          —
                        </span>
                      )}
                    </td>

                    {/* ─── PASS/FAIL ─── */}
                    <td className="px-3 py-2 text-center">
                      <span
                        className={`text-xs font-bold ${
                          entry.isPassed === true
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : entry.isPassed === false
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-gray-400'
                        }`}
                      >
                        {entry.isPassed === true
                          ? '✓ Pass'
                          : entry.isPassed === false
                          ? '✗ Fail'
                          : '—'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ─── BOTTOM INFO BAR ────────────────────────────── */}
        {!isReadOnly && (
          <div className="px-4 py-3 border-t border-gray-100 dark:border-dark-border bg-gray-50/50 dark:bg-dark-card/30">
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs">
              <span className="text-gray-500">
                Mid-Term Entered:{' '}
                <strong className="text-gray-900 dark:text-white">
                  {midTermEnteredCount}/{entries.length}
                </strong>
              </span>
              <span className="text-gray-500">
                Finals Entered:{' '}
                <strong className="text-gray-900 dark:text-white">
                  {finalsEnteredCount}/{entries.length}
                </strong>
              </span>
              {status === 'award-list-ready' || status === 'assigned' ? (
                <span className="text-blue-600 dark:text-blue-400 font-medium">
                  👆 Enter mid-term marks in the blue input boxes above, then
                  click &quot;Save Mid-Term&quot;
                </span>
              ) : status === 'midterm-saved' ? (
                <span className="text-amber-600 dark:text-amber-400 font-medium">
                  👆 Mid-term saved! Now enter Internal &amp; Final marks in
                  the amber/yellow input boxes, then click &quot;Save Finals&quot;
                </span>
              ) : status === 'finals-saved' ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  ✅ All marks saved! Click &quot;Send to HoD&quot; button above to
                  submit for approval
                </span>
              ) : null}
            </div>
          </div>
        )}
      </Card>

      {/* ─── CONFIRM MODALS ─────────────────────────────────── */}
      <ConfirmDialog
        isOpen={confirmMidterm}
        onClose={() => setConfirmMidterm(false)}
        onConfirm={handleSaveMidTerm}
        isLoading={savingMidterm}
        title="Save Mid-Term Marks?"
        message={`Save mid-term marks for ${newMidTermCount} student(s)? They will be notified immediately. After saving, you can enter Internal & Final marks.`}
        confirmLabel="Save & Notify Students"
        variant="info"
      />

      <ConfirmDialog
        isOpen={confirmFinals}
        onClose={() => setConfirmFinals(false)}
        onConfirm={handleSaveFinals}
        isLoading={savingFinals}
        title="Save Internal & Final Marks?"
        message={`Save marks for ${newFinalsCount} student(s)? Grades will be auto-calculated. Students will be notified. After saving, the "Send to HoD" button will appear.`}
        confirmLabel="Save & Calculate Grades"
        variant="warning"
      />
    </>
  );
};

export default MarksEntryTable;