import './story.css';
import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function Story() {
  const [story, setStory] = useState({});
  const [audioSupported, setAudioSupported] = useState(null);
  const { id } = useParams();
  const server = localStorage.getItem('server');
  const [selectedLanguage, setSelectedLanguage] = useState('en');

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

  const handleLanguageChange = (event) => {
    const newLanguage = event.target.value;
    setSelectedLanguage(newLanguage);
  };

  useEffect(() => {

    const fetchTranslation = async () => {
      try {
        const translationResponse = await fetch(`${server}/story/${id}/${selectedLanguage}`);
        if (!translationResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const translationData = await translationResponse.json();

        setStory(translationData);
      } catch (error) {
        console.error(error);
      }
    };
    fetchTranslation();
  }, [selectedLanguage]);


  useEffect(() => {
    setAudioSupported(null);

    const languageAudioIsSupported = async () => {
      try {
        // Assuming server, id, and setAudioSupported are defined elsewhere
        const fetchResponse = await fetch(`${server}/voice/${id}/${selectedLanguage}`);
        if (fetchResponse.ok) {
          // wait 3 seconds for the audio to be generated
          setTimeout(() => {
            setAudioSupported(true);
          }, 2000);
        }
        else {
          setAudioSupported(false);
        }
      } catch (error) {
        setAudioSupported(false);
      }
    };
  
    // Call the function when selectedLanguage changes
    languageAudioIsSupported();
  }, [selectedLanguage]);


  return (
    <div className="story-container">
      <button className="story-back-button" onClick={() => window.history.back()}>
        Back
      </button>
      <div>
        {story.languages && story.languages.length > 0 && (
          <select
            className="story-language-select"
            onChange={handleLanguageChange}
            value={selectedLanguage}
          >
            {story.languages.map((language) => (
              <option value={language.code} key={language.code}>
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

        {audioSupported === null && <p className="story-loading-audio">Fetching audio...</p>}
        {audioSupported === false && <p className="story-loading-audio">Language audio is not supported...</p>}
        {audioSupported === true && <audio className="story-audio" controls src={`${server}/${id}/${selectedLanguage}-audio.mp3`} /> }
      </div>
    </div>
  );
}
