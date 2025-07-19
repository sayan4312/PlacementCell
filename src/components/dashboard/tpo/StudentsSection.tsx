import React from 'react';
import { Plus, GraduationCap, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import apiClient from '../../../services/apiClient';

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
  YEAR_OPTIONS
}) => {
  const [importing, setImporting] = React.useState(false);
  const [importError, setImportError] = React.useState<string | null>(null);
  // Filter students by TPO's department
  const filteredStudents = students.filter(student => student.branch === tpoProfile?.department);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Student Management</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowStudentModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 focus:outline-none"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Student
          </button>
          <label className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 focus:outline-none cursor-pointer">
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
            className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-lg shadow hover:bg-gray-300 focus:outline-none"
          >
            Download Template
          </a>
        </div>
      </div>
      {importError && (
        <div className="text-red-600 text-sm text-center mt-2">{importError}</div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase">NAME</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase">EMAIL</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase">STUDENT ID</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase">BRANCH</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase">YEAR</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase">CGPA</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase">BACKLOGS</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase">PHONE</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase">ADDRESS</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredStudents.map((student, index, arr) => (
              <tr
                key={student._id}
                className={
                  `${index === 0 ? 'rounded-t-xl' : ''} ${index === arr.length - 1 ? 'rounded-b-xl' : ''} hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors`
                }
              >
                <td className="px-4 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100">
                  {typeof student.name === 'object' ? student.name?.value || 'Unknown' : student.name || 'Unknown'}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100">
                  {typeof student.email === 'object' ? student.email?.value || 'No Email' : student.email || 'No Email'}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100">
                  {typeof student.studentId === 'object' ? student.studentId?.value || 'N/A' : student.studentId || 'N/A'}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100">
                  {typeof student.branch === 'object' ? student.branch?.name || 'N/A' : student.branch || 'N/A'}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100">
                  {typeof student.year === 'object' ? student.year?.value || 'N/A' : student.year || 'N/A'}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100">
                  {typeof student.cgpa === 'object' ? student.cgpa?.value || 'N/A' : student.cgpa || 'N/A'}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100">
                  {typeof student.backlogs === 'object' ? student.backlogs?.value || 'N/A' : student.backlogs || 'N/A'}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100">
                  {typeof student.phone === 'object' ? student.phone?.value || 'N/A' : student.phone || 'N/A'}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100">
                  {typeof student.address === 'object' ? student.address?.value || 'N/A' : student.address || 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Add Student Modal */}
      {showStudentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg md:max-w-xl relative flex flex-col" style={{ maxHeight: '90vh' }}>
            <div className="flex flex-col md:flex-row items-start md:items-center px-6 py-4 rounded-t-2xl bg-gradient-to-r from-blue-700 to-purple-700 relative">
              <GraduationCap className="w-8 h-8 text-white mr-3 mb-2 md:mb-0" />
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white">Add Student</h2>
                <p className="text-white text-xs opacity-80 mt-1">Fill in the details to create a new student account for your department.</p>
              </div>
              <button onClick={() => setShowStudentModal(false)} className="absolute top-3 right-3 z-10 text-white hover:text-gray-200 focus:outline-none bg-black/20 rounded-full p-1">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={e => { e.preventDefault(); handleAddStudent(); }} className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Name</label>
                  <input type="text" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white" value={studentForm.name} onChange={e => setStudentForm({ ...studentForm, name: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Email</label>
                  <input type="email" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white" value={studentForm.email} onChange={e => setStudentForm({ ...studentForm, email: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Student ID (Roll No.)</label>
                  <input type="text" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white" value={studentForm.studentId} onChange={e => setStudentForm({ ...studentForm, studentId: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Branch/Department</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
                    value={tpoProfile?.department || ''}
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Year</label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={studentForm.year}
                    onChange={e => setStudentForm({ ...studentForm, year: e.target.value })}
                    required
                  >
                    <option value="" disabled>Select year</option>
                    {YEAR_OPTIONS.map(year => (
                      <option key={`year-${year}`} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">CGPA</label>
                  <input type="number" step="0.01" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white" value={studentForm.cgpa} onChange={e => setStudentForm({ ...studentForm, cgpa: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Backlogs</label>
                  <input type="number" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white" value={studentForm.backlogs} onChange={e => setStudentForm({ ...studentForm, backlogs: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Phone</label>
                  <input type="text" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white" value={studentForm.phone} onChange={e => setStudentForm({ ...studentForm, phone: e.target.value })} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Address</label>
                  <input type="text" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white" value={studentForm.address} onChange={e => setStudentForm({ ...studentForm, address: e.target.value })} />
                </div>
              </div>
              {studentModalError && <div className="text-red-600 text-sm text-center">{studentModalError}</div>}
              <div className="flex justify-end mt-4">
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 focus:outline-none">Add Student</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ToastContainer for toast notifications */}
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
    </div>
  );
};

export default StudentsSection; 