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
            className="input-glass"
            placeholder="Name"
          />
          <input
            type="text"
            name="phone"
            value={editForm.phone}
            onChange={handleEditFormChange}
            className="input-glass"
            placeholder="Phone"
          />
          <input
            type="text"
            name="address"
            value={editForm.address}
            onChange={handleEditFormChange}
            className="input-glass"
            placeholder="Address"
          />
          <input
            type="date"
            name="dateOfBirth"
            value={editForm.dateOfBirth}
            onChange={handleEditFormChange}
            className="input-glass"
            placeholder="Date of Birth"
          />
          <div className="flex space-x-2 mt-2">
            <button
              onClick={handleEditSave}
              className="btn-primary"
            >
              Save
            </button>
            <button
              onClick={handleEditCancel}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
      {/* Profile Header */}
      <div className="glass-card p-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {localUser?.name?.split(' ').map((n: string) => n[0]).join('')}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{localUser?.name}</h2>
              <p className="text-gray-400">{localUser?.branch}</p>
              <p className="text-sm text-gray-400">{localUser?.studentId} • {localUser?.year}</p>
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
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
              isEditing
                ? 'bg-white/5 cursor-not-allowed'
                : 'btn-primary'
            }`}
          >
            {isEditing ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-400"></div>
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
        
        {isAddingSkill && (
          <div className="mb-6 bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-white">Add New Skill</h4>
            </div>
            
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
              
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleSaveSkill}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Skill</span>
                </button>
                <button
                  onClick={handleCancelSkill}
                  className="btn-secondary px-6"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        
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
        
        {isAddingProject && (
          <div className="mb-6 bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-lg font-semibold text-white">Add New Project</h4>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Project Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={newProject.name}
                    onChange={(e) => setNewProject({...newProject, name: e.target.value})}
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
                    onChange={(e) => setNewProject({...newProject, tech: e.target.value})}
                    placeholder="e.g., React, Node.js, MongoDB"
                    className="input-glass w-full"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Project Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                  placeholder="Describe your project, its features, and your role..."
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
                  onChange={(e) => setNewProject({...newProject, github: e.target.value})}
                  placeholder="https://github.com/username/repository"
                  className="input-glass w-full"
                />
              </div>
              
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleSaveProject}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Project</span>
                </button>
                <button
                  onClick={handleCancelProject}
                  className="btn-secondary px-6"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        
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
            className={`text-indigo-400 hover:text-indigo-300 font-medium flex items-center space-x-1 ${
              isUploadingResume ? 'opacity-50 cursor-not-allowed' : ''
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSection; 