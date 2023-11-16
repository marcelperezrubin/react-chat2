/* App.jsx */

import io from 'socket.io-client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import './index.css';
import './App.scss';

const socket = io("/");

function App() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [room, setRoom] = useState('default');
  const [weather, setWeather] = useState(null);
  const [users, setUsers] = useState({});

  const handleRoomChange = (newRoom) => {
    console.log(`Leaving room ${room}`);
    socket.emit('leaveRoom', room);

    console.log(`Joining room ${newRoom}`);
    setRoom(newRoom);
    socket.emit('joinRoom', newRoom);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newMessage = {
      body: message,
      from: 'Me'
    }

    setMessages([...messages, newMessage]);
    socket.emit('message', message);
  };

  useEffect(() => {
    socket.on("message", receiveMessage);

    socket.on('connect', () => {
      obtenerPronosticoCiudad("Madrid");
      socket.emit('joinRoom', room);
    });

    return () => {
      socket.off("message", receiveMessage);
    };
  }, [room]);

  const obtenerPronosticoCiudad = async (ciudad) => {
    try {
      const apiKey = 'd853548071325aa0a422295f3d66d43e';
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${ciudad}&appid=${apiKey}`;

      const respuesta = await axios.get(url);
      const temperaturaCelsius = respuesta.data.main.temp - 273.15;
      const temperaturaFahrenheit = (temperaturaCelsius * 9/5) + 32;

      const pronostico = {
        ...respuesta.data,
        main: {
          ...respuesta.data.main,
          tempCelsius: temperaturaCelsius.toFixed(2),
          tempFahrenheit: temperaturaFahrenheit.toFixed(2),
        },
      };

      setWeather(pronostico);
    } catch (error) {
      console.error('Error al obtener el pronóstico del tiempo:', error.message);
      setWeather(null);
    }
  };

  const receiveMessage = (message) => {
    setMessages((state) => [...state, message]);
    setUsers((state) => {
      const updatedUsers = { ...state };
      updatedUsers[message.from] = room; // Asigna la sala al remitente
      return updatedUsers;
    });

    // Verifica si el mensaje indica que el usuario dejó la sala
    if (message.body === 'leftRoom' && message.from === 'Me') {
      setRoom('default');
    }
  };

  const handleLeaveRoom = () => {
    console.log(`Leaving room ${room}`);
    socket.emit('leaveRoom', room);
    socket.emit('message', 'leftRoom');
  };

  return (
    <div className="min-h-screen bg-zinc-800 text-white flex flex-col items-center justify-center">
      <form onSubmit={handleSubmit} className='bg-zinc-900 p-10 w-full md:w-1/2 lg:w-1/3'>
        <h1 className='text-2xl font-bold my-2'> Chat React App</h1>
        <input
          type="text"
          placeholder='Write your message...'
          className="border-2 border-zinc-500 p-2 w-full text-black"
          onChange={(e) => setMessage(e.target.value)}
        />

        <button className='btn mt-2 w-full md:w-auto'>
          Send
        </button>
      </form>

      <ul className="mt-4 w-full md:w-1/2 lg:w-1/3">
        {messages.map((message, i) => {
          const messageRoom = users[message.from];

          if (messageRoom === room) {
            return (
              <li key={i} className='my-2 p-2 table text-sm rounded-md bg-sky-600'>
                {message.from}:{message.body}
              </li>
            );
          }
          return null;
        })}
      </ul>

      <div className="mt-4">
        <label className="text-xl font-bold">Choose Room:</label>
        <select
          value={room}
          onChange={(e) => handleRoomChange(e.target.value)}
          className="border-2 border-zinc-500 p-2 text-black"
        >
          <option value="main">Main Room</option>
          <option value="room1">Room 1</option>
          <option value="room2">Room 2</option>
          {/* Agrega más opciones según tus necesidades */}
        </select>
      </div>

      {/* Botón para salir de la sala */}
      <button className="btn mt-2" onClick={handleLeaveRoom}>
        Leave Room
      </button>

      {weather && (
        <div className="mt-4">
          <h2 className="text-xl font-bold">Weather in {weather.name}</h2>
          <p>{weather.weather[0].description}</p>
          <p>Temperature: {weather.main.tempCelsius} °C / {weather.main.tempFahrenheit} °F</p>
        </div>
      )}
    </div>
  );
}

export default App;