import React from "react";
import { Link } from "react-router-dom";
import { 
  LayoutDashboard, 
  FolderOpen, 
  Settings, 
  HelpCircle,
  LucideIcon
} from "lucide-react";

interface SidebarItem {
  id: string;
  icon: LucideIcon;
  label: string;
  href: string;
}

interface SidebarProps {
  isOpen: boolean;
  activeItem: string;
  onItemClick: (id: string) => void;
}

export const sidebarItems: SidebarItem[] = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { id: "projects", icon: FolderOpen, label: "Projects", href: "/projects" },
  { id: "settings", icon: Settings, label: "Settings", href: "/settings" },
  { id: "help", icon: HelpCircle, label: "Help & Support", href: "/help" },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, activeItem, onItemClick }) => {
  return (
    <aside 
      className={`${isOpen ? 'w-64' : 'w-0 md:w-16'} transition-all duration-300 ease-in-out h-[calc(100vh-4rem)] border-r border-border/50 bg-background/95 fixed left-0 top-16 z-40 overflow-y-auto`}
    >
      <div className="py-4">
        <nav className="space-y-1 px-2">
          {sidebarItems.map((item) => {
            const isActive = activeItem === item.id;
            return (
              <Link
                key={item.id}
                to={item.href}
                className={`flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors group ${
                  isActive 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
                onClick={() => onItemClick(item.id)}
              >
                <item.icon className={`mr-3 h-5 w-5 ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`} />
                <span className={`${
                  isOpen 
                    ? 'opacity-100' 
                    : 'hidden md:block md:opacity-0 group-hover:opacity-100'
                } transition-opacity duration-300`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
