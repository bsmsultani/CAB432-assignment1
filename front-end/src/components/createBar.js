import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './createBar.css';

const CreateBar = () => {
  const [storyAbout, setStoryAbout] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const server = localStorage.getItem('server');

  const createStory = async (storyAbout) => {
    const response = await fetch(`${server}/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ storyAbout }),
    });
    const data = await response.json();
    data.success = response.ok;
    console.log(data);
    return data;
  }

  const handleCreate = () => {
    setIsLoading(true);
    createStory(storyAbout)
      .then((data) => {
        if (data.success) {
          const movieId = data.movieId;
          navigate(`/story/${movieId}`);
        }
      })
      .catch((err) => {
        alert(err);
      })
      .finally(() => {
        setIsLoading(false); // Reset isLoading when the request is complete
      });
  };

  return (
    <div className="create-bar">
      {/* create a place to translate the story */}

      <input
        className="create-bar__input"
        type="text"
        placeholder="Type a story to create..."
        value={storyAbout}
        onChange={(e) => setStoryAbout(e.target.value)}
      />
      <button
        className={`create-bar__button${isLoading ? ' create-bar__button--loading' : ''}`}
        onClick={isLoading ? () => {} : handleCreate} // Provide an empty function when isLoading is true
      >
        {isLoading ? (
          <div className="spinner"></div>
        ) : (
          'Create'
        )}
      </button>
    </div>
  );
};

export default CreateBar;
