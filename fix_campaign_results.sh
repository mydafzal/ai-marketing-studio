#\!/bin/bash

# Fix the CTR display for OUTCOME_TRAFFIC
sed -i '164s#format: (val) => `${((val || 0) / 100).toFixed(2)}%`,#format: (val) => `${(val || 0).toFixed(2)}%`,#' "/mnt/c/Users/Max/Desktop/Reeply AI Facebook Ads/Reeply AI Facebook/ai-chatbot-main/components/stocks/campaignresultsnew.tsx"

# Fix the CTR display for OUTCOME_LEADS
sed -i '194s#format: (val) => `${((val || 0) / 100).toFixed(2)}%`,#format: (val) => `${(val || 0).toFixed(2)}%`,#' "/mnt/c/Users/Max/Desktop/Reeply AI Facebook Ads/Reeply AI Facebook/ai-chatbot-main/components/stocks/campaignresultsnew.tsx"

# Fix for extended metrics display of CTR
sed -i '586s#{ label: '\''CTR'\'', value: `${(averageCtr / 100).toFixed(2)}%` },#{ label: '\''CTR'\'', value: `${(averageCtr).toFixed(2)}%` },#' "/mnt/c/Users/Max/Desktop/Reeply AI Facebook Ads/Reeply AI Facebook/ai-chatbot-main/components/stocks/campaignresultsnew.tsx"

# Fix the CTR display in daily table
sed -i '598s#<TdCell>{((item.ctr || 0) / 100).toFixed(2)}%</TdCell>#<TdCell>{(item.ctr || 0).toFixed(2)}%</TdCell>#' "/mnt/c/Users/Max/Desktop/Reeply AI Facebook Ads/Reeply AI Facebook/ai-chatbot-main/components/stocks/campaignresultsnew.tsx"

# Fix demographics chart to always use 'actions'
sed -i '859,862s#<Bar dataKey={(data) => {\n                    const primaryKey = getMetricKeyForCharts();\n                    return data[primaryKey] \!== undefined ? primaryKey : '\''actions'\'';\n                  }} fill="#8884d8" />#<Bar dataKey="actions" fill="#8884d8" />#' "/mnt/c/Users/Max/Desktop/Reeply AI Facebook Ads/Reeply AI Facebook/ai-chatbot-main/components/stocks/campaignresultsnew.tsx"

# Fix platforms chart to always use 'actions'
sed -i '874,877s#<Bar dataKey={(data) => {\n                    const primaryKey = getMetricKeyForCharts();\n                    return data[primaryKey] \!== undefined ? primaryKey : '\''actions'\'';\n                  }} fill="#82ca9d" />#<Bar dataKey="actions" fill="#82ca9d" />#' "/mnt/c/Users/Max/Desktop/Reeply AI Facebook Ads/Reeply AI Facebook/ai-chatbot-main/components/stocks/campaignresultsnew.tsx"

# Fix timing chart to always use 'actions'
sed -i '889,894s#<Line\n                    type="monotone"\n                    dataKey={(data) => {\n                      const primaryKey = getMetricKeyForCharts();\n                      return data[primaryKey] \!== undefined ? primaryKey : '\''actions'\'';\n                    }}#<Line\n                    type="monotone"\n                    dataKey="actions"#' "/mnt/c/Users/Max/Desktop/Reeply AI Facebook Ads/Reeply AI Facebook/ai-chatbot-main/components/stocks/campaignresultsnew.tsx"
