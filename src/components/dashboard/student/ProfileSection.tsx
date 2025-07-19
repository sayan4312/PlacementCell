import React, { useState } from 'react';
import { Edit, Star, CheckCircle, Mail, Phone, Calendar, Globe, FileText, Eye, Download, Plus, X } from 'lucide-react';
import apiClient from '../../../services/apiClient';
import Toast from './Toast';
import Modal from './Modal';

interface ProfileSectionProps {
  user: any;
  onUserUpdate?: (updatedUser: any) => void;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({ user, onUserUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [newProject, setNewProject] = useState({
    name: '',
    tech: '',
    description: '',
    github: ''
  });
  const [localUser, setLocalUser] = useState(user);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    dateOfBirth: user?.dateOfBirth || '',
  });

  // Helper to show a toast
  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ message: msg, type });
  };

  // Update local user when prop changes
  React.useEffect(() => {
    setLocalUser(user);
    setEditForm({
      name: user?.name || '',
      phone: user?.phone || '',
      address: user?.address || '',
      dateOfBirth: user?.dateOfBirth || '',
    });
  }, [user]);

  const updateLocalUser = (updates: any) => {
    const updatedUser = { ...localUser, ...updates };
    setLocalUser(updatedUser);
    if (onUserUpdate) {
      onUserUpdate(updatedUser);
    }
  };

  const handleEditProfile = () => {
    setIsEditing(true);
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditCancel = () => {
    setEditForm({
      name: user?.name || '',
      phone: user?.phone || '',
      address: user?.address || '',
      dateOfBirth: user?.dateOfBirth || '',
    });
    setIsEditing(false);
  };

  const handleEditSave = async () => {
    try {
      const response = await apiClient.put(`/users/${localUser._id}/profile`, editForm);
      setLocalUser(response.data.user);
      if (onUserUpdate) onUserUpdate(response.data.user);
      showToast('Profile updated successfully!', 'success');
      setIsEditing(false);
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to update profile', 'error');
    }
  };

  const handleAddSkill = () => {
    setIsAddingSkill(true);
  };

  const handleSaveSkill = async () => {
    if (newSkill.trim()) {
      try {
        const response = await apiClient.post('/skills', { name: newSkill.trim() });
        const updatedSkills = response.data.skills;
        updateLocalUser({ skills: updatedSkills, profileScore: response.data.profileScore });
        showToast(`Skill "${newSkill}" added successfully!`, 'success');
        setNewSkill('');
        setIsAddingSkill(false);
      } catch (error: any) {
        console.error('Error adding skill:', error);
        showToast(error.response?.data?.message || 'Failed to add skill', 'error');
      }
    }
  };

  const handleCancelSkill = () => {
    setNewSkill('');
    setIsAddingSkill(false);
  };

  const handleAddProject = () => {
    setIsAddingProject(true);
  };

  const handleSaveProject = async () => {
    if (newProject.name && newProject.tech && newProject.description) {
      try {
        const response = await apiClient.post('/users/projects', newProject);
        const updatedProjects = response.data.projects;
        updateLocalUser({ projects: updatedProjects, profileScore: response.data.profileScore });
        showToast(`Project "${newProject.name}" added successfully!`, 'success');
        setNewProject({ name: '', tech: '', description: '', github: '' });
        setIsAddingProject(false);
      } catch (error: any) {
        console.error('Error adding project:', error);
        showToast(error.response?.data?.message || 'Failed to add project', 'error');
      }
    } else {
      showToast('Please fill in all required fields (name, tech, description)', 'error');
    }
  };

  const handleCancelProject = () => {
    setNewProject({ name: '', tech: '', description: '', github: '' });
    setIsAddingProject(false);
  };

  const handleUploadResume = async () => {
    setIsUploadingResume(true);
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.pdf,.doc,.docx';
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const formData = new FormData();
          formData.append('resume', file);

          try {
            const response = await apiClient.post('/users/resume', formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });
            updateLocalUser({ resume: response.data.resume });
            showToast('Resume uploaded successfully!', 'success');
          } catch (uploadError) {
            console.error('Upload error:', uploadError);
            showToast('Failed to upload resume. Please try again.', 'error');
          }
        }
        setIsUploadingResume(false);
      };
      input.click();
    } catch (error) {
      console.error('Error uploading resume:', error);
      showToast('Failed to upload resume. Please try again.', 'error');
      setIsUploadingResume(false);
    }
  };

  const handleViewResume = () => {
    if (localUser?.resume?.url) {
      window.open(localUser.resume.url, '_blank');
    } else if (localUser?.resume?.filename) {
      window.open(`/api/users/resume/${localUser.resume.filename}`, '_blank');
    } else {
      showToast('No resume uploaded yet', 'error');
    }
  };

  const handleDownloadResume = () => {
    if (localUser?.resume?.url) {
      const link = document.createElement('a');
      link.href = localUser.resume.url;
      link.download = localUser.resume.filename || 'resume.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (localUser?.resume?.filename) {
      const link = document.createElement('a');
      link.href = `/api/users/resume/${localUser.resume.filename}`;
      link.download = localUser.resume.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      showToast('No resume uploaded yet', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast popup notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      {/* Edit Profile Modal */}
      <Modal isOpen={isEditing} onClose={handleEditCancel} title="Edit Profile">
        <div className="space-y-3">
          <input
            type="text"
            name="name"
            value={editForm.name}
            onChange={handleEditFormChange}
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="Name"
          />
          <input
            type="text"
            name="phone"
            value={editForm.phone}
            onChange={handleEditFormChange}
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="Phone"
          />
          <input
            type="text"
            name="address"
            value={editForm.address}
            onChange={handleEditFormChange}
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="Address"
          />
          <input
            type="date"
            name="dateOfBirth"
            value={editForm.dateOfBirth}
            onChange={handleEditFormChange}
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="Date of Birth"
          />
          <div className="flex space-x-2 mt-2">
            <button
              onClick={handleEditSave}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Save
            </button>
            <button
              onClick={handleEditCancel}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
      {/* Profile Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {localUser?.name?.split(' ').map((n: string) => n[0]).join('')}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{localUser?.name}</h2>
              <p className="text-gray-600 dark:text-gray-400">{localUser?.branch}</p>
              <p className="text-sm text-gray-500 dark:text-gray-500">{localUser?.studentId} • {localUser?.year}</p>
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium">CGPA: {localUser?.cgpa}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium">No Backlogs</span>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={handleEditProfile}
            disabled={isEditing}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              isEditing
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isEditing ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
            ) : (
              <Edit className="w-4 h-4" />
            )}
            <span>{isEditing ? 'Editing...' : 'Edit Profile'}</span>
          </button>
        </div>
        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="flex items-center space-x-3">
            <Mail className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
              <p className="text-gray-900 dark:text-white">{localUser?.email}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Phone className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
              <p className="text-gray-900 dark:text-white">{localUser?.phone}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Calendar className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Date of Birth</p>
              <p className="text-gray-900 dark:text-white">
                {localUser?.dateOfBirth
                  ? new Date(localUser.dateOfBirth).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                  : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Skills Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Technical Skills</h3>
          <button 
            onClick={handleAddSkill}
            className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
          >
            <Plus className="w-4 h-4" />
            <span>Add Skill</span>
          </button>
        </div>
        
        {isAddingSkill && (
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Enter skill name"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && handleSaveSkill()}
              />
              <button
                onClick={handleSaveSkill}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Save
              </button>
              <button
                onClick={handleCancelSkill}
                className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        
        <div className="flex flex-wrap gap-2">
          {localUser?.skills?.map((skill: string, index: number) => (
            <span
              key={index}
              className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Projects Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Projects</h3>
          <button 
            onClick={handleAddProject}
            className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
          >
            <Plus className="w-4 h-4" />
            <span>Add Project</span>
          </button>
        </div>
        
        {isAddingProject && (
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-3">
            <input
              type="text"
              value={newProject.name}
              onChange={(e) => setNewProject({...newProject, name: e.target.value})}
              placeholder="Project name"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="text"
              value={newProject.tech}
              onChange={(e) => setNewProject({...newProject, tech: e.target.value})}
              placeholder="Technologies used"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <textarea
              value={newProject.description}
              onChange={(e) => setNewProject({...newProject, description: e.target.value})}
              placeholder="Project description"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="url"
              value={newProject.github}
              onChange={(e) => setNewProject({...newProject, github: e.target.value})}
              placeholder="GitHub URL (optional)"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="flex items-center space-x-2">
              <button
                onClick={handleSaveProject}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Save Project
              </button>
              <button
                onClick={handleCancelProject}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        
        <div className="space-y-4">
          {localUser?.projects?.map((project: any, index: number) => (
            <div key={index} className="p-5 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 flex flex-col gap-2 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-lg text-gray-900 dark:text-white">{project.name}</h4>
                  <span className="inline-block mt-1 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded-full text-xs font-semibold">
                    {project.tech}
                  </span>
                </div>
                {project.github && (
                  <a
                    href={project.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium text-sm bg-blue-50 dark:bg-blue-900 px-3 py-1 rounded-lg transition"
                  >
                    <Globe className="w-4 h-4" />
                    View
                  </a>
                )}
              </div>
              <hr className="my-2 border-gray-300 dark:border-gray-700" />
              <p className="text-gray-700 dark:text-gray-300 text-sm">{project.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Resume Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Resume</h3>
          <button 
            onClick={handleUploadResume}
            disabled={isUploadingResume}
            className={`text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1 ${
              isUploadingResume ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isUploadingResume ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            ) : (
              <Plus className="w-4 h-4" />
            )}
            <span>{isUploadingResume ? 'Uploading...' : 'Upload New'}</span>
          </button>
        </div>
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{localUser?.resume?.filename || 'No resume uploaded'}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {localUser?.resume?.uploadDate ? `Uploaded on ${localUser.resume.uploadDate} • ${localUser.resume.size}` : 'Upload your resume to get started'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={handleViewResume}
              className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
              title="View Resume"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button 
              onClick={handleDownloadResume}
              className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
              title="Download Resume"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSection; 