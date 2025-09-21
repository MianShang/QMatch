import { useEffect } from 'react';
import { createPortal } from 'react-dom'; //createPortal : 드롭다운이 부모 컴포넌트의 레이아웃에 제약을 안받게함(최상단에 위치)

//드롭박스 위치조정을 위함 
export default function DropdownPortal({ x, y, onClose, children }) {
  useEffect(() => {
    const close = () => onClose?.(); //onClose 함수가 있으면 실행
    // ?.은 객체나 함수가 존재할 수도 있고 없을 수도 있는 상황에서, 안전하게 접근하거나 호출할 수 있게 해주는 문법
    document.addEventListener('click', close);   //다른데 클릭하면 닫아
    window.addEventListener('scroll', close, true); //스크롤 내려도 닫아
    window.addEventListener('resize', close); //창 크기 변경해도 닫아
    return () => {
      document.removeEventListener('click', close);   //메모리 누수 방지를 위해 모두 언마운트
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [onClose]); //useEffect 재사용을 위함

  return createPortal(
    <div
      style={{ position: 'fixed', top: y, left: x, zIndex: 999999 }} //뜨는 위치를 x,y값에 맞추고 화면 최상단 
      onClick={(e) => e.stopPropagation()} //드롭다운 내부 클릭 시에 닫히는 버그 방지 
    >
      {children} {/*부모 컴포넌트 즉 여기서는 드롭다운에서 뜨는 메뉴 이름들*/}
    </div>,
    document.body //드롭다운을 body 최상단에 직접 렌더링
  );
}
