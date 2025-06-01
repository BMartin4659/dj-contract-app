# Set the Google Maps API key environment variable
$env:NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = "AIzaSyC-5o9YY4NS8y8F2ZTg8-zibHYRP_1dOEc"

# Display the environment variable to confirm it's set
Write-Host "Environment variable set: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = $env:NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"

# Run the development server
Write-Host "Starting development server..."
npm run dev 