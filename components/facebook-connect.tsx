'use client';

export default function FacebookConnect() {
  const connectFacebook = () => {
    window.location.href = '/api/facebook';
  };

  return (
    <button 
      onClick={connectFacebook}
      className="h-10 px-4 flex items-center justify-center bg-[#5890FF] text-white rounded-md shadow-md transition-transform transform hover:scale-105 active:scale-100 focus:outline-none font-bold"
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="white" 
        className="mr-2"
      >
        <path d="M9.198 21.5h4v-8.01h3.604l.396-3.98h-4V7.5a1 1 0 0 1 1-1h3v-4h-3a5 5 0 0 0-5 5v2.01h-2l-.396 3.98h2.396v8.01Z" />
      </svg>
      Login with Facebook
    </button>
  );
}
