import React from 'react';
import { Plus, GraduationCap, Pencil } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import apiClient from '../../../services/apiClient';
import * as XLSX from 'xlsx';
import Modal from '../student/Modal';

interface StudentsSectionProps {
  students: any[];
  showStudentModal: boolean;
  setShowStudentModal: (show: boolean) => void;
  studentForm: any;
  setStudentForm: (form: any) => void;
  studentModalError: string;
  handleAddStudent: () => void;
  tpoProfile: any;
  YEAR_OPTIONS: string[];
  editingStudent: any;
  setEditingStudent: (student: any) => void;
}

const StudentsSection: React.FC<StudentsSectionProps> = ({
  students,
  showStudentModal,
  setShowStudentModal,
  studentForm,
  setStudentForm,
  studentModalError,
  handleAddStudent,
  tpoProfile,
  YEAR_OPTIONS,
  editingStudent,
  setEditingStudent
}) => {
  const [importing, setImporting] = React.useState(false);
  const [importError, setImportError] = React.useState<string | null>(null);

  // New State for Hierarchical View
  const [selectedBatch, setSelectedBatch] = React.useState<string | null>(null);
  const [selectedSection, setSelectedSection] = React.useState<string | null>(null);

  // Filter students by TPO's department
  const filteredStudents = students.filter(student => {

    const branchName = typeof student.branch === 'object' ? student.branch?.name : student.branch;

    return branchName === tpoProfile?.department;
  });

  // Group Students by Batch (Year)
  const batches = React.useMemo(() => {
    const groups: { [key: string]: any[] } = {};
    filteredStudents.forEach(student => {
      const studentId = typeof student.studentId === 'object' ? student.studentId?.value : student.studentId;
      if (studentId && studentId.length === 10) {
        // ID Format: YYPRDDD S RR
        // YY = First 2 chars -> Batch Year
        const yearPrefix = studentId.substring(0, 2);
        if (!isNaN(parseInt(yearPrefix))) {
          const startYear = 2000 + parseInt(yearPrefix);
          const batchLabel = `${startYear}-${startYear + 4}`;
          if (!groups[batchLabel]) groups[batchLabel] = [];
          groups[batchLabel].push(student);
        }
      }
    });
    return groups;
  }, [filteredStudents]);

  const getSectionsForBatch = (batch: string) => {
    const batchStudents = batches[batch] || [];
    const sections = new Set<string>();
    batchStudents.forEach(s => {
      const id = typeof s.studentId === 'object' ? s.studentId?.value : s.studentId;
      // Section is at index 7 (0-indexed) in YYPRDDD S RR (length 10)
      // e.g., 22EG105C50 -> C is at index 7
      if (id && id.length === 10) {
        sections.add(id.charAt(7));
      }
    });
    return Array.from(sections).sort();
  };

  const getStudentsForSection = (batch: string, section: string) => {
    const batchStudents = batches[batch] || [];
    return batchStudents.filter(s => {
      const id = typeof s.studentId === 'object' ? s.studentId?.value : s.studentId;
      return id && id.length === 10 && id.charAt(7) === section;
    });
  };

  // Export Logic
  const handleExport = () => {
    if (selectedBatch && !selectedSection) {
      // Export Batch (Multi-sheet: One per Section)
      const wb = XLSX.utils.book_new();
      const sections = getSectionsForBatch(selectedBatch);

      sections.forEach(section => {
        const sectionStudents = getStudentsForSection(selectedBatch, section).map(s => ({
          Name: typeof s.name === 'object' ? s.name?.value : s.name,
          Email: typeof s.email === 'object' ? s.email?.value : s.email,
          'Student ID': typeof s.studentId === 'object' ? s.studentId?.value : s.studentId,
          Branch: typeof s.branch === 'object' ? s.branch?.name : s.branch,
          Year: typeof s.year === 'object' ? s.year?.value : s.year,
          CGPA: typeof s.cgpa === 'object' ? s.cgpa?.value : s.cgpa,
          Phone: typeof s.phone === 'object' ? s.phone?.value : s.phone
        }));

        const ws = XLSX.utils.json_to_sheet(sectionStudents);
        XLSX.utils.book_append_sheet(wb, ws, `Section ${section}`);
      });

      XLSX.writeFile(wb, `${tpoProfile?.department}_Batch_${selectedBatch}_Students.xlsx`);
      toast.success(`Batch ${selectedBatch} exported successfully!`);
    } else if (selectedBatch && selectedSection) {
      // Export Section (Single Sheet)
      const sectionStudents = getStudentsForSection(selectedBatch, selectedSection).map(s => ({
        Name: typeof s.name === 'object' ? s.name?.value : s.name,
        Email: typeof s.email === 'object' ? s.email?.value : s.email,
        'Student ID': typeof s.studentId === 'object' ? s.studentId?.value : s.studentId,
        Branch: typeof s.branch === 'object' ? s.branch?.name : s.branch,
        Year: typeof s.year === 'object' ? s.year?.value : s.year,
        CGPA: typeof s.cgpa === 'object' ? s.cgpa?.value : s.cgpa,
        Phone: typeof s.phone === 'object' ? s.phone?.value : s.phone
      }));

      const ws = XLSX.utils.json_to_sheet(sectionStudents);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `Section ${selectedSection}`);
      XLSX.writeFile(wb, `${tpoProfile?.department}_Batch_${selectedBatch}_Section_${selectedSection}.xlsx`);
      toast.success(`Section ${selectedSection} exported successfully!`);
    }
  };

  const handleEditClick = (student: any) => {
    setEditingStudent(student);
    setStudentForm({
      name: student.name || '',
      email: student.email || '',
      studentId: typeof student.studentId === 'object' ? student.studentId?.value : student.studentId,
      branch: typeof student.branch === 'object' ? student.branch?.name : student.branch,
      // year: typeof student.year === 'object' ? student.year?.value : student.year, // Deprecated
      cgpa: typeof student.cgpa === 'object' ? student.cgpa?.value : student.cgpa || '',
      backlogs: typeof student.backlogs === 'object' ? student.backlogs?.value : student.backlogs || '',
      phone: typeof student.phone === 'object' ? student.phone?.value : student.phone || '',
      address: student.address || ''
    });
    setShowStudentModal(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-white">Student Management</h3>
        <div className="flex gap-3">
          {/* Export Button (Visible only when filtering) */}
          {(selectedBatch || selectedSection) && (
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <GraduationCap className="w-4 h-4" />
              Export {selectedSection ? 'Section' : 'Batch'}
            </button>
          )}

          <button
            onClick={() => setShowStudentModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Student
          </button>
          <label className="btn-secondary flex items-center gap-2 cursor-pointer">
            Import Students
            <input
              type="file"
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              style={{ display: 'none' }}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setImporting(true);
                setImportError(null);
                const formData = new FormData();
                formData.append('file', file);
                try {
                  const token = localStorage.getItem('token');
                  const res = await fetch('/api/users/import-students', {
                    method: 'POST',
                    body: formData,
                    headers: {
                      'Authorization': `Bearer ${token}`
                    }
                  });
                  const data = await res.json();
                  if (res.ok) {
                    toast.success(data.message || 'Students imported successfully.');
                    window.location.reload();
                  } else {
                    setImportError(data.message || 'Failed to import students.');
                    toast.error(data.message || 'Failed to import students.');
                  }
                } catch (err) {
                  setImportError('Network error. Please try again.');
                  toast.error('Network error. Please try again.');
                } finally {
                  setImporting(false);
                }
              }}
            />
          </label>
          <a
            href="/sample-students-template.csv"
            download
            className="btn-secondary flex items-center gap-2"
          >
            Download Template
          </a>
        </div>
      </div>
      {importError && (
        <div className="glass-card p-3 text-center">
          <p className="text-red-400 text-sm">{importError}</p>
        </div>
      )}
      {/* Navigation Breadcrumbs */}
      {(selectedBatch || selectedSection) && (
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
          <button onClick={() => { setSelectedBatch(null); setSelectedSection(null); }} className="hover:text-white transition-colors">Batches</button>
          {selectedBatch && (
            <>
              <span>/</span>
              <button onClick={() => setSelectedSection(null)} className="hover:text-white transition-colors">{selectedBatch}</button>
            </>
          )}
          {selectedSection && (
            <>
              <span>/</span>
              <span className="text-white">Section {selectedSection}</span>
            </>
          )}
        </div>
      )}

      {/* Level 1: Batches View */}
      {!selectedBatch && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Object.keys(batches).sort().reverse().map(batch => (
            <motion.div
              key={batch}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedBatch(batch)}
              className="glass-card p-6 cursor-pointer hover:bg-white/5 transition-colors border-l-4 border-indigo-500"
            >
              <h3 className="text-xl font-bold text-white mb-2">{batch}</h3>
              <p className="text-gray-400 text-sm">{batches[batch].length} Students</p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                {Array.from(new Set(batches[batch].map(s => {

                  const id = typeof s.studentId === 'object' ? s.studentId?.value : s.studentId;
                  return id && id.length === 10 ? id.charAt(7) : '?';
                }))).sort().map(sec => (
                  <span key={sec} className="bg-white/10 px-2 py-1 rounded">{sec}</span>
                ))}
              </div>
            </motion.div>
          ))}
          {Object.keys(batches).length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              No batches found for your department.
            </div>
          )}
        </div>
      )}

      {/* Level 2: Sections View */}
      {selectedBatch && !selectedSection && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {getSectionsForBatch(selectedBatch).map(section => {
            const count = filteredStudents.filter(s => {
              const id = typeof s.studentId === 'object' ? s.studentId?.value : s.studentId;
              if (!id || id.length !== 10) return false;
              const batchYear = parseInt(id.substring(0, 2)) + 2000;
              const batchStr = `${batchYear}-${batchYear + 4}`;
              const sec = id.charAt(7);
              return batchStr === selectedBatch && sec === section;
            }).length;

            return (
              <motion.div
                key={section}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedSection(section)}
                className="glass-card p-6 cursor-pointer hover:bg-white/5 transition-colors border-l-4 border-emerald-500"
              >
                <h3 className="text-2xl font-bold text-white mb-2">Section {section}</h3>
                <p className="text-gray-400 text-sm">{count} Students</p>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Level 3: Student List View */}
      {selectedBatch && selectedSection && (
        <div className="glass-card p-1 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white/70 uppercase tracking-wider bg-white/5">NAME</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white/70 uppercase tracking-wider bg-white/5">EMAIL</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white/70 uppercase tracking-wider bg-white/5">ROLL NO</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white/70 uppercase tracking-wider bg-white/5">BRANCH</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white/70 uppercase tracking-wider bg-white/5">YEAR</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white/70 uppercase tracking-wider bg-white/5">CGPA</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white/70 uppercase tracking-wider bg-white/5">BACKLOGS</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white/70 uppercase tracking-wider bg-white/5">PHONE</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white/70 uppercase tracking-wider bg-white/5">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {getStudentsForSection(selectedBatch, selectedSection).map((student) => (
                  <tr
                    key={student._id}
                    className="hover:bg-white/5 transition-all duration-200"
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-white/90">
                      {typeof student.name === 'object' ? student.name?.value || 'Unknown' : student.name || 'Unknown'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-white/90">
                      {typeof student.email === 'object' ? student.email?.value || 'No Email' : student.email || 'No Email'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-white/90 font-mono text-emerald-400">
                      {typeof student.studentId === 'object' ? student.studentId?.value || 'N/A' : student.studentId || 'N/A'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-white/90">
                      {typeof student.branch === 'object' ? student.branch?.name || 'N/A' : student.branch || 'N/A'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-white/90">
                      {student.calculatedCurrentYear ?
                        <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 font-mono text-xs">
                          {student.calculatedCurrentYear}{student.calculatedCurrentYear > 4 ? '+' : ''} Year
                        </span>
                        :
                        (typeof student.year === 'object' ? student.year?.value || 'N/A' : student.year || 'N/A')
                      }
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-white/90">
                      {typeof student.cgpa === 'object' ? student.cgpa?.value || 'N/A' : student.cgpa || 'N/A'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-white/90">
                      {typeof student.backlogs === 'object' ? student.backlogs?.value || 'N/A' : student.backlogs || 'N/A'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-white/90">
                      {typeof student.phone === 'object' ? student.phone?.value || 'N/A' : student.phone || 'N/A'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-white/90">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEditClick(student); }}
                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-blue-400"
                        title="Edit Student"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* Add Student Modal */}
      <Modal
        isOpen={showStudentModal}
        onClose={() => {
          setShowStudentModal(false);
          setEditingStudent(null);
          setStudentForm({ name: '', email: '', studentId: '', branch: '', year: '', cgpa: '', backlogs: '', phone: '', address: '' });
        }}
        title={editingStudent ? "Edit Student" : "Add New Student"}
      >
        <div className="text-gray-400 text-sm mb-6 -mt-4">{editingStudent ? "Update student details" : "Enter student details manually"}</div>
        <form onSubmit={e => { e.preventDefault(); handleAddStudent(); }} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Full Name <span className="text-red-400">*</span></label>
              <input
                type="text"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors placeholder:text-gray-600"

                value={studentForm.name}
                onChange={e => setStudentForm({ ...studentForm, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Email Address <span className="text-red-400">*</span></label>
              <input
                type="email"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors placeholder:text-gray-600"

                value={studentForm.email}
                onChange={e => setStudentForm({ ...studentForm, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Student ID (Roll No) <span className="text-red-400">*</span></label>
              <input
                type="text"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors placeholder:text-gray-600 font-mono"

                value={studentForm.studentId}
                onChange={e => setStudentForm({ ...studentForm, studentId: e.target.value })}
                required
              />
              <p className="text-xs text-gray-500">Format: YYPRDDD S RR (e.g. 22EG105C50)</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Branch <span className="text-red-400">*</span></label>
              <input
                type="text"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white/50 cursor-not-allowed"
                value={tpoProfile?.department || ''}
                disabled
              />
            </div>

            {/* Manual Year Selection Removed as per Dynamic Calculation */
            /* The system now calculates year based on Student ID */}

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">CGPA</label>
              <input
                type="number"
                step="0.01"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors placeholder:text-gray-600"
                placeholder="0.00"
                value={studentForm.cgpa}
                onChange={e => setStudentForm({ ...studentForm, cgpa: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Active Backlogs</label>
              <input
                type="number"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors placeholder:text-gray-600"
                placeholder="0"
                value={studentForm.backlogs}
                onChange={e => setStudentForm({ ...studentForm, backlogs: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Phone Number</label>
              <input
                type="tel"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors placeholder:text-gray-600"
                placeholder="+91..."
                value={studentForm.phone}
                onChange={e => setStudentForm({ ...studentForm, phone: e.target.value })}
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-medium text-gray-300">Address</label>
              <textarea
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors placeholder:text-gray-600 resize-none h-24"
                placeholder="Enter full address..."
                value={studentForm.address}
                onChange={e => setStudentForm({ ...studentForm, address: e.target.value })}
              />
            </div>
          </div>

          {studentModalError && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
              <p className="text-red-400 text-sm">{studentModalError}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={() => {
                setShowStudentModal(false);
                setEditingStudent(null);
                setStudentForm({ name: '', email: '', studentId: '', branch: '', cgpa: '', backlogs: '', phone: '', address: '' });
              }}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 transition-all text-sm font-medium"
            >
              {editingStudent ? "Update Student" : "Add Student"}
            </button>
          </div>
        </form>
      </Modal>
      {/* ToastContainer for toast notifications */}
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
    </div>
  );
};

export default StudentsSection; 