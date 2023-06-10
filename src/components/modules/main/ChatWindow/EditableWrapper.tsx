import React, { useState } from 'react';

const EditableWrapper = ({
  children,
}: {
  children: (props: {
    isEditing: boolean;
    setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
  }) => React.ReactNode;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  return <>{children({ isEditing, setIsEditing })}</>;
};

export default EditableWrapper;
