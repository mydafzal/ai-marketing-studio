#\!/bin/bash

# List of files to update
FILES=(
  "app/api/admin/fetch-chat-extra-details/route.ts"
  "app/api/admin/fetch-user-default-extra-details/route.ts"
  "app/api/facebook/callback/route.ts"
  "app/api/facebook/route.ts"
  "app/api/fasty-bot/get-campaign-historical-metrics/route.ts"
  "app/api/fasty-bot/proxy-get-adcreatives/route.ts"
  "app/api/fasty-bot/proxy-get-adset/route.ts"
  "app/api/fasty-bot/proxy-get-adsets/route.ts"
  "app/api/fasty-bot/proxy-get-all-ad-metrics-by-campaign-id/route.ts"
  "app/api/fasty-bot/proxy-get-campaign-leads-count/route.ts"
  "app/api/fasty-bot/proxy-get-campaign-summary/route.ts"
  "app/api/fasty-bot/proxy-get-campaigns/route.ts"
  "app/api/fasty-bot/proxy-get-historical-leads/route.ts"
  "app/api/fasty-bot/proxy-get-image-detail/route.ts"
  "app/api/fasty-bot/proxy-get-video-detail/route.ts"
  "app/api/fasty-bot/proxy-reach-estimate/route.ts"
  "app/api/fasty-bot/proxy-search/route.ts"
  "app/api/kv/fetch-campaign-structure/route.ts"
  "app/api/video-status/[id]/route.ts"
)

# Check if force-dynamic is already added
for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    if \! grep -q "export const dynamic" "$file"; then
      # Get the first import line
      first_import=$(grep -m 1 "import" "$file")
      
      # Create a temporary file
      tmp_file=$(mktemp)
      
      # Write to temporary file with the dynamic export added after imports
      awk -v dynamic_added=0 '
        /^import/ {
          print $0
          if (\!dynamic_added) {
            # Check if there are no more import statements
            getline next_line
            if (next_line \!~ /^import/) {
              print "\n// Mark this route as dynamic"
              print "export const dynamic = '\''force-dynamic'\'';\n"
              dynamic_added=1
            }
            print next_line
          }
        }
        \!/^import/ {
          if (\!dynamic_added) {
            print "\n// Mark this route as dynamic"
            print "export const dynamic = '\''force-dynamic'\'';\n"
            dynamic_added=1
          }
          print $0
        }
      ' "$file" > "$tmp_file"
      
      # Replace the original file
      mv "$tmp_file" "$file"
      
      echo "Updated $file"
    else
      echo "Skipping $file - already has dynamic export"
    fi
  else
    echo "Warning: File $file does not exist"
  fi
done
