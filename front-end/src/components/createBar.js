import React from 'react';
import './createBar.css';

const CreateBar = () => {
  return (
    <div className="create-bar">
      <input
        type="text"
        placeholder="Enter something..."
      />
      <button className="create-bar__button">Create</button>
    </div>
  );
};

export default CreateBar;
