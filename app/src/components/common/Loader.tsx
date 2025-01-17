const ScreenLoader = ({ message = "Cooking..." }: { message?: string }) => {
  return (
    <div className="min-h-screen w-full flex flex-col space-y-5 items-center justify-center bg-black text-white">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
      <p className="animate-pulse">{message}</p>
    </div>
  );
};

const loader = () => {
  return (
    <div className="loader">
      <div className="loader__spinner"></div>
    </div>
  );
};

export { ScreenLoader, loader };
