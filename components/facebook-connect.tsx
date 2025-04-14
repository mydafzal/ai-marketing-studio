'use client';

export default function FacebookConnect() {
  const connectFacebook = () => {
    window.location.href = '/api/facebook';
  };

  return (
    <button 
      onClick={connectFacebook}
      className="h-12 px-6 flex items-center justify-center bg-[#1A77F2] text-white rounded-md shadow-md hover:brightness-95 active:scale-99 focus:outline-none font-bold text-base"
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        className="mr-3 flex-shrink-0"
      >
        <circle cx="12" cy="12" r="12" fill="white" />
        <path d="M16.5 12.15h-2.77v10.13h-4.17V12.15H7.5V8.57h2.07V6.27c0-1.71 0.81-4.39 4.39-4.39l3.22 0.01v3.59h-2.34c-0.38 0-0.92 0.19-0.92 1.01v2.08h3.26L16.5 12.15z" fill="#1A77F2" />
      </svg>
      <span className="whitespace-nowrap">Login with Facebook</span>
    </button>
  );
}
