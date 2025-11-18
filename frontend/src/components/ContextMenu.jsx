import ReactDOM from "react-dom";
import { useEffect, useRef } from "react";
import "./ContextMenu.css";

function ContextMenu({ x, y, items, onClose }) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // 메뉴 영역 바깥을 클릭했을 때만 닫기
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose?.();
      }
    };

    // mousedown을 쓰면 클릭 타이밍 겹침 방지됨
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleItemClick = (onClick) => {
    onClick?.();
    onClose?.(); // 내부 항목 클릭 시 닫기
  };

  const menu = (
    <ul
      ref={menuRef}
      className="context-menu"
      style={{
        top: y,
        left: x,
      }}
    >
      {items.map((item, idx) => (
        <li 
          key={idx} 
          className={item.className || ''}
          onClick={() => handleItemClick(item.onClick)}
        >
          {item.label}
        </li>
      ))}
    </ul>
  );

  return ReactDOM.createPortal(menu, document.body);
}

export default ContextMenu;
