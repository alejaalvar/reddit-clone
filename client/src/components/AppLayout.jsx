/**
 * @file Creates and exports AppLayout, the frame every page renders inside
 * @module client/src/components/AppLayout.jsx
 * @author Alejandro Alvarado <alejalva@pdx.edu>
 */

import { Outlet } from 'react-router';
import NavBar from './NavBar.jsx';

/**
 * A layout route: the NavBar on top and the matched page below it,
 * rendered where <Outlet /> is. Pages supply only their own content
 * and leave the single <main> landmark to this component.
 *
 * The Sidebar from the frontend plan will sit next to <main> here
 * once Part 2 builds it.
 */
export default function AppLayout() {
  return (
    <div className="min-h-screen bg-base-200">
      <NavBar />
      <main className="mx-auto max-w-5xl p-4">
        <Outlet />
      </main>
    </div>
  );
}
