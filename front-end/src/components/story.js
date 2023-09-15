import './story.css';
import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function Story() {
  const [story, setStory] = useState({});
  const { id } = useParams();
  const server = localStorage.getItem('server');

  useEffect(() => {
    const fetchStory = async () => {
      try {
        const response = await fetch(`${server}/story/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const data = await response.json();
        setStory(data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchStory();

  }, [id]);

  return (
    <div className="story-container">
      <button className="story-back-button" onClick={() => window.history.back()}>Back</button>
      <h2 className="story-title">{story.title}</h2>
      <h3 className="story-theme">{story.theme}</h3>
      {story.content && story.content.map((line, index) => <p key={index} className="story-content">{line}</p>)}
      <div className="story-audio-container">
        <audio className="story-audio" controls src={`${server}/${id}/audio.mp3`} />
      </div>
    </div>
  );
  
}
