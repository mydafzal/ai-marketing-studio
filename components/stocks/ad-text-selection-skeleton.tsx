const placeholderSuggestions = [
    {
      text: 'Your ad text suggestion will appear here.',
      date: '2022-10-01'
    }
  ];
  
  export const AdTextSelectionSkeleton = () => {
    return (
      <div className="-mt-2 flex w-full flex-col gap-4 py-4">
        {placeholderSuggestions.map((suggestion, index) => (
          <div
            key={index}
            className="flex shrink-0 flex-col gap-2 rounded-lg p-4 bg-zinc-700"
          >
            <div className="w-24 rounded-md bg-zinc-600 text-sm text-transparent">
              {suggestion.date}
            </div>
            <div className="flex items-center justify-between">
              <div className="w-48 rounded-md bg-zinc-600 text-lg text-transparent">
                {suggestion.text}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  export default AdTextSelectionSkeleton;
  