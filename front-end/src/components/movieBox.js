import './movieBox.css';
import { useNavigate } from 'react-router-dom';


export default function MovieBox(props) {
    const navigate = useNavigate();
    const { movieId, movieName, movieTheme } = props;

    const handleClick = () => {
        navigate(`/story/${movieId}`);
    }

    return (
        <div className="movieBox" onClick={handleClick}>
            <h3>{movieName}</h3>
            <p>{movieTheme}</p>
        </div>
    )

}