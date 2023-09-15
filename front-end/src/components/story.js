import './story.css';
import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function Story() {
  const [story, setStory] = useState({});
  const [audioExists, setAudioExists] = useState(false); // Track whether audio exists
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

        // Check if audio file exists, then setAudioExists to true
        const audioResponse = await fetch(`${server}/${id}/audio.mp3`);
        if (audioResponse.ok) {
          setAudioExists(true);
        } else {
          // Retry fetching audio after 1 second
          setTimeout(async () => {
            const retryAudioResponse = await fetch(`${server}/${id}/audio.mp3`);
            if (retryAudioResponse.ok) {
              setAudioExists(true);
            }
          }, 2000);
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchStory();
  }, [id]);

  const handleLanguageChange = (event) => {
    // fetch '/story/:id/:language' and setStory

    const fetchStory = async () => {
      try {
        const response = await fetch(`${server}/story/${id}/${event.target.value}`);
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const data = await response.json();

        setStory(data);
      } catch (error) {
        console.error(error);
      }
    }

    fetchStory();
  };


  return (
    <div className="story-container">
      {/* languages is an array that has all the languages and their codes */}
      <button className="story-back-button" onClick={() => window.history.back()}>Back</button>
      <div>
      {story.languages && story.languages.length > 0 && (
        <select className="story-language-select" onChange={handleLanguageChange}>
          {story.languages.map((language) => (
            <option selected={language.code === "en"} value={language.code} key={language.code}>
              {language.name}
            </option>
          ))}
        </select>
      )}
      </div>
      <h2 className="story-title">{story.title}</h2>
      <h3 className="story-theme">{story.theme}</h3>
      {story.content && story.content.map((line, index) => <p key={index} className="story-content">{line}</p>)}
      <div className="story-audio-container">
        {audioExists ? (
          <audio className="story-audio" controls src={`${server}/${id}/audio.mp3`} />
        ) : (
          <p className="story-loading-audio">Loading audio...</p>
        )}
      </div>
    </div>
  );
  
}
