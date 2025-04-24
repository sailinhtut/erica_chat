'use client';

import { generateUniqueId } from '@/utils/path_resolver';
import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { UAParser } from 'ua-parser-js';

// const socket = io('http://localhost:4010');
const socket = io('http://erica.sailinhtut.dev/serice:4010');

export default function Home() {
	const [message, setMessage] = useState('');
	const [chat, setChat] = useState<any[]>([]);
	const [username, setUsername] = useState('');
	const [deviceInfo, setDeviceInfo] = useState('');
	const endRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		forceUsername();
		setUsername(localStorage.getItem('username')!);

		const parser = new UAParser();
		const result = parser.getResult();
		setDeviceInfo(result.device.model ?? result.os.name ?? '');

		socket.on('message', (msg: any) => {
			const receivedMsg = JSON.parse(msg);
			setChat((prev) => [...prev, receivedMsg]);
		});

		socket.on('getMessages', (msg: string) => {
			const data = JSON.parse(msg);
			setChat(data);
			setTimeout(() => scrollToBottom(true), 300);
		});

		socket.emit('getMessages');

		return () => {
			socket.off('message');
			socket.off('getMessages');
		};
	}, []);

	const forceUsername = () => {
		const name = localStorage.getItem('username');
		if (!name) {
			const result = prompt('Enter Username (Required):');
			if (result) {
				localStorage.setItem('username', result);
			} else {
				forceUsername();
			}
		}
		setUsername(name!);
	};

	const updateUsername = () => {
		const result = prompt('Update Username:', username);
		if (result) {
			localStorage.setItem('username', result);
			setUsername(result);
		}
	};

	const formatTime = (time: string) => {
		if (typeof window === 'undefined') return ''; // Prevent SSR mismatch
		return new Date(time).toLocaleTimeString();
	};

	const scrollToBottom = (direct: boolean = false) => {
		endRef.current?.scrollIntoView({ behavior: direct ? 'instant' : 'smooth' });
	};

	const sendMessage = () => {
		const name = localStorage.getItem('username');
		if (!name) {
			forceUsername();
		}

		const newMessage = {
			id: generateUniqueId(),
			userId: navigator.userAgent,
			userName: name,
			deviceName: deviceInfo,

			time: new Date().toISOString(),
			message: message,
		};
		socket.emit('message', JSON.stringify(newMessage));
		setMessage('');
		setTimeout(() => scrollToBottom(), 300);
	};

	const deleteMessage = (msg: any) => {
		if (msg.userId !== navigator.userAgent) {
			alert('You cannot delete this message. It is owned by ' + msg.userId);
			return;
		}
		socket.emit('deleteMessage', msg.userId, msg.id);
		setChat((prev) => prev.filter((e) => e.id !== msg.id));
		setTimeout(() => alert(`${msg.message} deleted successfully`), 500);
	};

	return (
		<div>
			<div className='bg-white drop-shadow h-[50px] flex items-center justify-center border-b border-b-gray-300 fixed top-0 left-0 right-0'>
				<div className='w-full px-5 flex flex-row justify-between'>
					<p className='font-bold w-fit'>🌈 Erica Chat...</p>
					<div
						className='text-sm text-blue-800 font-semibold cursor-pointer'
						onClick={() => {
							updateUsername();
						}}>
						{username}
					</div>
				</div>
			</div>
			<p>{chat.length}</p>
			{chat.length !== 0 && (
				<div className='m-3 mt-[50px] mb-[100px]'>
					{chat.map((msg: any, index: number) => (
						<p
							className='w-fit py-1.5 px-3 bg-gray-100 border border-gray-300 rounded mt-3'
							key={index}>
							{msg.message}
							<div>
								<span className='text-xs text-slate-500'>
									{msg.userName}
								</span>
								<span className='ml-2 text-xs text-slate-500'>
									{formatTime(msg.time)}
									{msg.deviceName ? ' - ' : ''}
									{msg.deviceName ?? ''}
								</span>
								<span
									className='ml-3 text-xs text-slate-400 hover:text-red-500 active:text-red-800 cursor-pointer'
									onClick={() => deleteMessage(msg)}>
									Remove
								</span>
							</div>
						</p>
					))}
					<div ref={endRef} className='w-[50px]' />
				</div>
			)}

			<div className='flex flex-row bg-white p-3 border-t border-t-gray-300 fixed bottom-0 left-0 right-0'>
				<input
					value={message}
					placeholder='Type a message'
					className='w-full bg-gray-100 shadow py-1 mr-3 rounded-lg border border-gray-300 px-3'
					multiple={true}
					onChange={(e) => setMessage(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === 'Enter' && !e.shiftKey) {
							e.preventDefault();
							if (message) sendMessage();
						}
					}}
				/>
				<button
					onClick={() => (message ? sendMessage() : null)}
					className={`${
						message
							? 'bg-blue-800 hover:bg-blue-900 active:bg-blue-800'
							: 'bg-gray-500'
					} rounded px-3 py-1 shadow-sm text-white  `}>
					Send
				</button>
			</div>
		</div>
	);
}
