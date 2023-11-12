/* App.jsx */

import io from 'socket.io-client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.scss';

const socket = io("/");

function App() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [weather, setWeather] = useState(null);

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
      // Llamada a la función para obtener el pronóstico del tiempo
      obtenerPronosticoCiudad("London");  // aqui podemos cambiar "London" por la ciudad que deseamos
    });

    return () => {
      socket.off("message", receiveMessage);
    };
  }, []);

  // Función para obtener el pronóstico del tiempo
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

  const receiveMessage = (message) =>
    setMessages((state) => [...state, message]);

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
        {messages.map((message, i) => (
          <li key={i} className='my-2 p-2 table text-sm rounded-md bg-sky-600'>
            {message.from}:{message.body}
          </li>
        ))}
      </ul>

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