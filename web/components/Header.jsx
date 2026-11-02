import Image from 'next/image';

export default function Header() {
  return (
    <header className="topbar">
      <div className="brand">
        <Image
          className="brand-mark"
          src="/Minimal Play Download Icon.png"
          alt=""
          width={27}
          height={27}
          priority
        />
        <span>Cliply</span>
      </div>
      <span className="header-note"><span className="header-status-dot" /> Media clip studio</span>
    </header>
  );
}
