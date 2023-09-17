import React, { useEffect, useState } from "react";
import CreateBar from "./createBar";
import MovieBox from "./movieBox";
import "./home.css";

export default function Home() {
  // Get server from local storage
  const server = localStorage.getItem('server');
  const [stories, setStories] = useState([]);
  const [counter, setCounter] = useState(0);

  // Use useEffect to fetch stories from the server on mount
  useEffect(() => {
    fetch(server)
      .then(res => res.json())
      .then(data => {
        console.log(data);
        setStories(data.movieData);
        setCounter(data.counter);
      })
      .catch(err => {
        console.error(err);
      });
  }, [server]); // Add [server] as a dependency to avoid infinite requests

  return (
    <div className="home">
      <CreateBar />
      <h2>Stories</h2>
      <h3>{counter}</h3>
      <div className="movieList">
        {stories.length > 0 ? (
          stories.map(story => (
            <MovieBox
              movieId={story.movieId}
              movieName={story.movieName}
              movieTheme={story.movieTheme}
            />
          ))
        ) : (
          <p>No stories available.</p>
        )}
      </div>
    </div>
  );
}
