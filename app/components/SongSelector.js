'use client';

// SongSelector component for song suggestions
const SongSelector = ({ 
  songValue, 
  artistValue, 
  onSongChange, 
  onArtistChange, 
  songName, 
  artistName, 
  suggestions, 
  placeholder = "Song title",
  isMobile = false,
  singleField = false,
  singleFieldName,
  singleFieldValue,
  onSingleFieldChange
}) => {
  if (singleField) {
    return (
      <div className="space-y-2">
        <select
          name={singleFieldName}
          value={singleFieldValue}
          onChange={(e) => {
            if (e.target.value && e.target.value !== 'custom') {
              onSingleFieldChange(e);
            } else if (e.target.value === 'custom') {
              // Clear the field for custom entry
              onSingleFieldChange({ target: { name: singleFieldName, value: '' } });
            }
          }}
          style={{
            width: '100%',
            padding: 'clamp(12px, 2vw, 16px)',
            border: '1px solid #ccc',
            borderRadius: '8px',
            fontSize: isMobile ? '16px' : 'clamp(16px, 2.5vw, 18px)',
            backgroundColor: 'white',
            marginBottom: '0.5rem',
            minHeight: isMobile ? '44px' : 'auto'
          }}
        >
          <option value="">Choose from popular songs...</option>
          {suggestions?.map((song, index) => (
            <option key={index} value={song}>{song}</option>
          ))}
          <option value="custom">🎵 Enter custom song...</option>
        </select>
        
        <input
          type="text"
          name={singleFieldName}
          value={singleFieldValue}
          onChange={onSingleFieldChange}
          style={{
            width: '100%',
            padding: 'clamp(12px, 2vw, 16px)',
            border: '1px solid #ccc',
            borderRadius: '8px',
            fontSize: isMobile ? '16px' : 'clamp(16px, 2.5vw, 18px)',
            backgroundColor: 'white',
            minHeight: isMobile ? '44px' : 'auto'
          }}
          placeholder={placeholder}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <select
          value=""
          onChange={(e) => {
            if (e.target.value) {
              const [title, artist] = e.target.value.split(' – ');
              onSongChange({ target: { name: songName, value: title || '' } });
              onArtistChange({ target: { name: artistName, value: artist || '' } });
            }
          }}
          style={{
            width: '100%',
            padding: 'clamp(12px, 2vw, 16px)',
            border: '1px solid #ccc',
            borderRadius: '8px',
            fontSize: isMobile ? '16px' : 'clamp(16px, 2.5vw, 18px)',
            backgroundColor: 'white',
            marginBottom: '0.5rem',
            minHeight: isMobile ? '44px' : 'auto'
          }}
        >
          <option value="">Choose from popular songs...</option>
          {suggestions?.map((song, index) => (
            <option key={index} value={song}>{song}</option>
          ))}
        </select>
      </div>
      
      <div>
        <input
          type="text"
          name={songName}
          value={songValue}
          onChange={onSongChange}
          style={{
            width: '100%',
            padding: 'clamp(12px, 2vw, 16px)',
            border: '1px solid #ccc',
            borderRadius: '8px',
            fontSize: isMobile ? '16px' : 'clamp(16px, 2.5vw, 18px)',
            backgroundColor: 'white',
            marginBottom: '1.2rem',
            minHeight: isMobile ? '44px' : 'auto'
          }}
          placeholder="Song title"
        />
        <input
          type="text"
          name={artistName}
          value={artistValue}
          onChange={onArtistChange}
          style={{
            width: '100%',
            padding: 'clamp(12px, 2vw, 16px)',
            border: '1px solid #ccc',
            borderRadius: '8px',
            fontSize: isMobile ? '16px' : 'clamp(16px, 2.5vw, 18px)',
            backgroundColor: 'white',
            minHeight: isMobile ? '44px' : 'auto'
          }}
          placeholder="Artist"
        />
      </div>
    </div>
  );
};

export default SongSelector; 