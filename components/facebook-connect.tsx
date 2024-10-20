'use client';

export default function FacebookConnect() {
  const connectFacebook = () => {
    window.location.href = '/api/facebook';
  };

  return (
    <button 
      onClick={connectFacebook}
      className="h-10 px-4 flex items-center justify-center bg-[#1877F2] text-white rounded-md shadow-md transition-transform transform hover:scale-105 active:scale-100 focus:outline-none"
    >
      Connect to Facebook
    </button>
  );
}
