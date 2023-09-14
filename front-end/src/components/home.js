import React, { useState, useEffect } from "react";
import "./home.css";

export default function Home() {
  const [storyAbout, setStoryAbout] = useState("");
  const [storyLoading, setStoryLoading] = useState(false);
  const [story, setStory] = useState(true);



  const createStory = () => {
    if (storyAbout.trim() === "") {
      // Prevent creating a story with an empty title
      return;
    }

    setStoryLoading(true);

    const server = localStorage.getItem("server");

    fetch(`${server}/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        storyAbout: storyAbout.trim(),
      }),
    })
      .then((res) => {
        if (res.status === 200) {
          return res.json(); // Parse JSON data from the response
        } else {
          setStoryLoading(false);
          alert("An error occurred while creating the story");
          throw new Error("Error creating story");
        }
      })
      .then((data) => {
        setStoryLoading(false);
        setStory(data); // Update the 'story' state with the fetched story
        setStoryAbout("");
        alert("Story created successfully");
      })
      .catch((error) => {
        setStoryLoading(false);
        console.error("Error creating story:", error);
      });
  };

  useEffect(() => {
    if (storyAbout === "") {
      setStoryLoading(false);
    }
  }, [storyAbout]);

  return (
    <div>
      <div className="create-bar">
        <input
          type="text"
          placeholder="Create a story about"
          value={storyAbout}
          onChange={(e) => setStoryAbout(e.target.value)}
          disabled={storyLoading}
        />
        <button
          onClick={createStory}
          disabled={storyAbout.trim() === "" || storyLoading}
        >
          Create
        </button>
      </div>
      {storyAbout.length === 0 && (
        <div className="loading">
          <p>Type something to create a story about</p>
        </div>
      )}

      {storyLoading && (
        <div className="loading">
          <p>Creating story about "{storyAbout.trim()}", please wait...</p>
          <div className="loader"></div>
        </div>
      )}

      {/* Conditionally render the story */}
      {story && (
        <div className="story">
          <h1>{story.title}</h1>
          <h2>{story.theme}</h2>        
          <p>{story.content}</p> 
        </div>
      )}
    </div>
  );
}
