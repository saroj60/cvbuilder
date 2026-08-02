import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';

export function Layout() {
  return (
    <div className="h-screen w-screen flex flex-col bg-background overflow-hidden">
      <Navbar />
      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 p-0 overflow-auto w-full h-full">
          <div className="w-full h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
