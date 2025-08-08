import React from 'react';
import { RefreshCw, Download, CheckCircle, AlertCircle, Info, Calendar, Hash } from 'lucide-react';

interface UpdateScreenUIProps {
  currentVersion: string;
  buildNumber: string;
  releaseDate: string;
  isCheckingUpdate: boolean;
  updateStatus: string;
  lastUpdateCheck: string;
  onCheckUpdate: () => void;
}

const UpdateScreenUI: React.FC<UpdateScreenUIProps> = ({
  currentVersion,
  buildNumber,
  releaseDate,
  isCheckingUpdate,
  updateStatus,
  lastUpdateCheck,
  onCheckUpdate
}) => {
  const getStatusIcon = () => {
    if (isCheckingUpdate) {
      return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
    }
    if (updateStatus.includes('available')) {
      return <Download className="w-5 h-5 text-orange-500" />;
    }
    if (updateStatus.includes('latest')) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    if (updateStatus.includes('Failed')) {
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
    return <Info className="w-5 h-5 text-gray-500" />;
  };

  const getStatusColor = () => {
    if (updateStatus.includes('available')) {
      return 'text-orange-600';
    }
    if (updateStatus.includes('latest')) {
      return 'text-green-600';
    }
    if (updateStatus.includes('Failed')) {
      return 'text-red-600';
    }
    return 'text-gray-600';
  };

  return (
    <div className="w-full h-full bg-main-gray rounded-lg shadow-custom overflow-hidden">
      {/* Content */}
      <div className="p-6 h-full overflow-y-auto">
        {/* Check Update Button */}
        <div className="mb-8">
          <button
            onClick={onCheckUpdate}
            disabled={isCheckingUpdate}
            className={`flex items-center space-x-3 px-6 py-3 rounded-md font-medium transition-all duration-200 transform hover:scale-105 shadow-md ${
              isCheckingUpdate 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
            } text-white`}
          >
            <RefreshCw className={`w-6 h-6 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
            <span className="text-lg">
              {isCheckingUpdate ? 'Checking for Updates...' : 'Check for Updates'}
            </span>
          </button>
        </div>

        {/* Current Version Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Version Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Info className="w-6 h-6 text-blue-500" />
              <h3 className="text-xl font-bold text-gray-800">Current Version</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Version:</span>
                <span className="text-gray-800 font-semibold text-lg">{currentVersion}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Build:</span>
                <span className="text-gray-800 font-mono text-sm">{buildNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Release Date:</span>
                <span className="text-gray-800">{releaseDate}</span>
              </div>
            </div>
          </div>

          {/* Update Status Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-3 mb-4">
              {getStatusIcon()}
              <h3 className="text-xl font-bold text-gray-800">Update Status</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <span className="text-gray-600">Status:</span>
                <span className={`font-semibold ${getStatusColor()}`}>
                  {updateStatus || 'Ready to check'}
                </span>
              </div>
              {lastUpdateCheck && (
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Last checked:</span>
                  <span className="text-gray-800 text-sm">{lastUpdateCheck}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Update Information */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <Download className="w-6 h-6 text-green-500" />
            <h3 className="text-xl font-bold text-gray-800">Update Information</h3>
          </div>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">How Updates Work</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Updates are checked automatically when you click "Check for Updates"</li>
                <li>• The system will notify you if a new version is available</li>
                <li>• Updates include bug fixes, new features, and security improvements</li>
                <li>• Your data and settings are preserved during updates</li>
              </ul>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-2">Update Features</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Automatic version detection</li>
                <li>• Secure update verification</li>
                <li>• Rollback capability if needed</li>
                <li>• Minimal downtime during updates</li>
              </ul>
            </div>
          </div>
        </div>

        {/* System Information */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Hash className="w-6 h-6 text-purple-500" />
            <h3 className="text-xl font-bold text-gray-800">System Information</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Platform:</span>
                <span className="text-gray-800">Web Application</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Framework:</span>
                <span className="text-gray-800">React + TypeScript</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Build Tool:</span>
                <span className="text-gray-800">Vite</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Environment:</span>
                <span className="text-gray-800">Production</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Update Channel:</span>
                <span className="text-gray-800">Stable</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Auto-Update:</span>
                <span className="text-gray-800">Manual</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateScreenUI;