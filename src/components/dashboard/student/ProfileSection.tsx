import React, { useState } from 'react';
import { Edit, Star, CheckCircle, Mail, Phone, Calendar, Globe, FileText, Eye, Download, Plus, Trash2 } from 'lucide-react';
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
        const response = await apiClient.post('/users/skills', { skill: newSkill.trim() });
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

  const getResumeUrl = () => {
    console.log('Resume debug info:', localUser?.resume);
    if (!localUser?.resume) return null;
    return localUser.resume.url || null;
  };

  const handleViewResume = () => {
    const url = getResumeUrl();
    if (url) {
      window.open(url, '_blank');
    } else {
      showToast('No resume uploaded yet', 'error');
    }
  };

  const handleDownloadResume = () => {
    const url = getResumeUrl();
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = localUser?.resume?.filename || 'resume.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      showToast('No resume uploaded yet', 'error');
    }
  };

  const handleDeleteResume = async () => {
    if (!localUser?.resume?.url) {
      showToast('No resume to delete', 'error');
      return;
    }

    if (!window.confirm('Are you sure you want to delete your resume?')) {
      return;
    }

    try {
      await apiClient.delete('/users/resume');
      updateLocalUser({ resume: undefined });
      showToast('Resume deleted successfully!', 'success');
    } catch (error: any) {
      console.error('Error deleting resume:', error);
      showToast(error.response?.data?.message || 'Failed to delete resume', 'error');
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
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
            <input
              type="text"
              name="name"
              value={editForm.name}
              onChange={handleEditFormChange}
              className="input-glass w-full opacity-60 cursor-not-allowed"
              placeholder="Name"
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Phone</label>
            <input
              type="text"
              name="phone"
              value={editForm.phone}
              onChange={handleEditFormChange}
              className="input-glass w-full"
              placeholder="Phone"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Address</label>
            <input
              type="text"
              name="address"
              value={editForm.address}
              onChange={handleEditFormChange}
              className="input-glass w-full"
              placeholder="Address"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Date of Birth</label>
            <input
              type="date"
              name="dateOfBirth"
              value={editForm.dateOfBirth}
              onChange={handleEditFormChange}
              className="input-glass w-full"
              placeholder="Date of Birth"
            />
          </div>
          <button
            onClick={handleEditSave}
            className="btn-primary w-full flex items-center justify-center gap-2 mt-4"
          >
            <CheckCircle size={18} />
            <span>Save Changes</span>
          </button>
        </div>
      </Modal>
      {/* Profile Header */}
      <div className="glass-card p-4 sm:p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4 sm:mb-6">
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-lg sm:text-xl md:text-2xl font-bold flex-shrink-0">
              {localUser?.name?.split(' ').map((n: string) => n[0]).join('')}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white truncate">{localUser?.name}</h2>
              <p className="text-gray-400 text-sm sm:text-base">{localUser?.branch}</p>
              <p className="text-xs sm:text-sm text-gray-400">{localUser?.studentId} • {localUser?.year}</p>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2">
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
                  <span className="text-xs sm:text-sm font-medium">CGPA: {localUser?.cgpa}</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                  <span className="text-xs sm:text-sm font-medium">No Backlogs</span>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={handleEditProfile}
            disabled={isEditing}
            className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg transition-all text-sm self-start sm:self-auto flex-shrink-0 ${isEditing
              ? 'bg-white/5 cursor-not-allowed'
              : 'btn-primary'
              }`}
          >
            {isEditing ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-400"></div>
            ) : (
              <Edit className="w-4 h-4" />
            )}
            <span>{isEditing ? 'Editing...' : 'Edit'}</span>
          </button>
        </div>
        {/* Contact Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="flex items-center space-x-3">
            <Mail className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-400">Email</p>
              <p className="text-white">{localUser?.email}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Phone className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-400">Phone</p>
              <p className="text-white">{localUser?.phone}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Calendar className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-400">Date of Birth</p>
              <p className="text-white">
                {localUser?.dateOfBirth
                  ? new Date(localUser.dateOfBirth).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                  : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Skills Section */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">Technical Skills</h3>
          <button
            onClick={handleAddSkill}
            className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center space-x-1"
          >
            <Plus className="w-4 h-4" />
            <span>Add Skill</span>
          </button>
        </div>

        <Modal isOpen={isAddingSkill} onClose={handleCancelSkill} title="Add New Skill">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Skill Name
              </label>
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="e.g., React, Node.js, Python"
                className="input-glass w-full"
                onKeyPress={(e) => e.key === 'Enter' && handleSaveSkill()}
              />
            </div>

            <button
              onClick={handleSaveSkill}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-4"
            >
              <Plus className="w-4 h-4" />
              <span>Add Skill</span>
            </button>
          </div>
        </Modal>

        <div className="flex flex-wrap gap-2">
          {localUser?.skills?.map((skill: string, index: number) => (
            <span
              key={index}
              className="px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-full text-sm font-medium border border-indigo-500/20"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Projects Section */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">Projects</h3>
          <button
            onClick={handleAddProject}
            className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center space-x-1"
          >
            <Plus className="w-4 h-4" />
            <span>Add Project</span>
          </button>
        </div>

        <Modal isOpen={isAddingProject} onClose={handleCancelProject} title="Add New Project">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Project Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                placeholder="e.g., E-commerce Platform"
                className="input-glass w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Technologies Used <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={newProject.tech}
                onChange={(e) => setNewProject({ ...newProject, tech: e.target.value })}
                placeholder="e.g., React, Node.js, MongoDB"
                className="input-glass w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Project Description <span className="text-red-400">*</span>
              </label>
              <textarea
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                placeholder="Describe your project..."
                rows={4}
                className="input-glass w-full resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                GitHub URL <span className="text-gray-500">(Optional)</span>
              </label>
              <input
                type="url"
                value={newProject.github}
                onChange={(e) => setNewProject({ ...newProject, github: e.target.value })}
                placeholder="https://github.com/username/repository"
                className="input-glass w-full"
              />
            </div>

            <button
              onClick={handleSaveProject}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-4"
            >
              <Plus className="w-4 h-4" />
              <span>Add Project</span>
            </button>
          </div>
        </Modal>

        <div className="space-y-4">
          {localUser?.projects?.map((project: any, index: number) => (
            <div key={index} className="p-5 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all flex flex-col gap-2 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-lg text-white">{project.name}</h4>
                  <span className="inline-block mt-1 px-3 py-1 bg-purple-500/10 text-purple-400 rounded-full text-xs font-semibold border border-purple-500/20">
                    {project.tech}
                  </span>
                </div>
                {project.github && (
                  <a
                    href={project.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium text-sm bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/20 transition"
                  >
                    <Globe className="w-4 h-4" />
                    View
                  </a>
                )}
              </div>
              <hr className="my-2 border-white/10" />
              <p className="text-gray-400 text-sm">{project.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Resume Section */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">Resume</h3>
          <button
            onClick={handleUploadResume}
            disabled={isUploadingResume}
            className={`text-indigo-400 hover:text-indigo-300 font-medium flex items-center space-x-1 ${isUploadingResume ? 'opacity-50 cursor-not-allowed' : ''
              }`}
          >
            {isUploadingResume ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-400"></div>
            ) : (
              <Plus className="w-4 h-4" />
            )}
            <span>{isUploadingResume ? 'Uploading...' : 'Upload New'}</span>
          </button>
        </div>
        <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-pink-500/10 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-pink-400" />
            </div>
            <div>
              <p className="font-medium text-white">{localUser?.resume?.filename || 'No resume uploaded'}</p>
              <p className="text-sm text-gray-400">
                {localUser?.resume?.uploadDate ? `Uploaded on ${localUser.resume.uploadDate} • ${localUser.resume.size}` : 'Upload your resume to get started'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleViewResume}
              className="p-2 text-gray-400 hover:bg-white/10 rounded-lg transition-colors"
              title="View Resume"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={handleDownloadResume}
              className="p-2 text-gray-400 hover:bg-white/10 rounded-lg transition-colors"
              title="Download Resume"
            >
              <Download className="w-4 h-4" />
            </button>
            {localUser?.resume?.url && (
              <button
                onClick={handleDeleteResume}
                className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                title="Delete Resume"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSection; 