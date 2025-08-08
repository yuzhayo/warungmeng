import React from 'react';
import { useUpdateScreenLogic } from './UpdateScreen_Logic';
import UpdateScreenUI from './UpdateScreen_UI';

interface UpdateScreenProps {
  isCheckingUpdate: boolean;
  updateStatus: string;
  lastUpdateCheck: string;
  onCheckUpdate: () => void;
}

const UpdateScreen: React.FC<UpdateScreenProps> = ({
  isCheckingUpdate,
  updateStatus,
  lastUpdateCheck,
  onCheckUpdate
}) => {
  const {
    currentVersion,
    buildNumber,
    releaseDate
  } = useUpdateScreenLogic();

  return (
    <UpdateScreenUI
      currentVersion={currentVersion}
      buildNumber={buildNumber}
      releaseDate={releaseDate}
      isCheckingUpdate={isCheckingUpdate}
      updateStatus={updateStatus}
      lastUpdateCheck={lastUpdateCheck}
      onCheckUpdate={onCheckUpdate}
    />
  );
};

export default UpdateScreen;