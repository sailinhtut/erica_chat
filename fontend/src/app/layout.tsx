import type { Metadata } from 'next';
import '@/app/css/styles.css';

export const metadata: Metadata = {
	title: 'Realtime Testing',
	description: 'This is realtime testing',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang='en'>
			<body>{children}</body>
		</html>
	);
}
