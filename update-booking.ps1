# Script to update the booking confirmation screen
# Make a backup of the original file
Copy-Item -Path "app/page.js" -Destination "app/page.js.before_update" -Force
Write-Host "Backup created at app/page.js.before_update" -ForegroundColor Cyan

# Read the current file
$content = Get-Content -Path "app/page.js" -Raw
Write-Host "Original file read, length: $($content.Length) characters" -ForegroundColor Cyan

# Read our replacement text file
$replacements = Get-Content -Path "booking-edits.txt" -Raw
Write-Host "Replacement file read, length: $($replacements.Length) characters" -ForegroundColor Cyan

# Split the replacement text into sections
$buttonReplacement = [regex]::Match($replacements, "BUTTON_REPLACEMENT:(.*?)BUTTON_WITH:", [System.Text.RegularExpressions.RegexOptions]::Singleline).Groups[1].Value.Trim()
$buttonWith = [regex]::Match($replacements, "BUTTON_WITH:(.*)", [System.Text.RegularExpressions.RegexOptions]::Singleline).Groups[1].Value.Trim()

Write-Host "Button replacement text length: $($buttonReplacement.Length) characters" -ForegroundColor Yellow
Write-Host "Button with text length: $($buttonWith.Length) characters" -ForegroundColor Yellow

# Simple pattern match for the button
$buttonPattern = "Book Another Event"
if ($content.Contains($buttonPattern)) {
    Write-Host "Found 'Book Another Event' text in the file" -ForegroundColor Green
    
    # Find the entire button context
    $buttonStart = "          <button"
    $buttonEnd = "          </button>"
    
    $startPos = $content.IndexOf($buttonStart)
    $endPos = $content.IndexOf($buttonEnd, $startPos) + $buttonEnd.Length
    
    if ($startPos -ge 0 -and $endPos -gt $startPos) {
        $originalButton = $content.Substring($startPos, $endPos - $startPos)
        Write-Host "Found button from position $startPos to $endPos" -ForegroundColor Green
        Write-Host "Original button length: $($originalButton.Length) characters" -ForegroundColor Green
        
        # Replace just the button text
        $updatedContent = $content.Substring(0, $startPos) + 
                         $buttonWith + 
                         $content.Substring($endPos)
        
        # Write the updated content back to the file
        Set-Content -Path "app/page.js" -Value $updatedContent
        Write-Host "Button text replaced and file updated successfully!" -ForegroundColor Green
    } else {
        Write-Host "Could not find complete button section" -ForegroundColor Red
    }
} else {
    Write-Host "Button text 'Book Another Event' not found in the file!" -ForegroundColor Red
} 