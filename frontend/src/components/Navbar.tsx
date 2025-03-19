import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { logout, getCurrentUser } from "../lib/auth";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { User, Settings, LogOut } from "lucide-react";

interface NavbarProps {
  title?: string;
}

export function Navbar({ title }: NavbarProps) {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState<string>("user@example.com");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    // Fetch user info when component mounts
    const fetchUserInfo = async () => {
      const user = await getCurrentUser();
      if (user && user.email) {
        setUserEmail(user.email);
      }
    };

    fetchUserInfo();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const firstLetter = userEmail ? userEmail.charAt(0).toUpperCase() : "U";

  return (
    <header className="bg-white border-b border-gray-200 py-3">
      <div className="container mx-auto px-4 flex items-center justify-between">
        {/* Mobile menu button */}
        <button className="md:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        {/* Dashboard Title - Only visible on mobile */}
        <h1 className="text-lg font-semibold md:hidden">{title || "API Dashboard"}</h1>

        {/* Dashboard Title - Visible on desktop */}
        <div className="hidden md:flex items-center space-x-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-7 w-7 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
            />
          </svg>
          <h1 className="text-xl font-bold text-gray-900">{title || "API Dashboard"}</h1>
        </div>

        {/* Spacer */}
        <div className="flex-1 md:flex-none md:mx-8"></div>

        {/* User menu */}
        <div className="flex items-center space-x-4">
          {/* User dropdown */}
          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center space-x-1 focus:outline-none">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
                  {firstLetter}
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>My Account</span>
                  <span className="text-xs text-gray-500 font-normal">{userEmail}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="cursor-pointer md:hidden" 
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Logout Button on larger screens */}
          <div className="hidden md:block">
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
} 