import { useState, useRef, useEffect } from "react";
import KebabIcon from "./KebabIcon";

/**
 * A dropdown menu component that displays a list of actions
 * @param {Object} props - Component props
 * @param {Array} props.items - Array of menu items with label and action properties
 */
const DropdownMenu = ({ items }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Toggle menu open/closed
  const toggleMenu = (e) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  // Handle menu item click
  const handleItemClick = (e, action) => {
    e.stopPropagation();
    action();
    setIsOpen(false);
  };

  return (
    <div className="dropdown-menu-container" ref={menuRef}>
      <button
        className="dropdown-menu-trigger"
        onClick={toggleMenu}
        aria-label="More options"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <KebabIcon />
      </button>
      {isOpen && (
        <div className="dropdown-menu">
          {items.map((item, index) => (
            <div
              key={index}
              className={`dropdown-menu-item ${item.type || ""}`}
              onClick={(e) => handleItemClick(e, item.action)}
            >
              {item.icon && (
                <span className="dropdown-menu-item-icon">{item.icon}</span>
              )}
              <span className="dropdown-menu-item-label">{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DropdownMenu;
