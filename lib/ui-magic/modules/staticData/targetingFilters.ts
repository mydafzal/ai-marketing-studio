const TARGETING_FILTERS = `
    This is the targeting list from which you can choose:
    
[Category
Demographics
1
Demographics
Education
Education Level
At high school
At university
At university (postgraduate)
Doctorate degree
Foundation degree
High school leaver
Master’s degree
Professional degree
Some high school
Some university
Some university (postgraduate)
University graduate
Unspecified
Fields of study*
Schools / Universities*
Undergrad years

Demographics
Financial
Income (can only be targeted in the US, so do not use those for ads that happen elsewhere)
1. $30000 - $39999
2. $40000 - $49999
3. $50000 - $74999
4. $75000 - $99999
5. $100000 - $129999
6. $125000 - $149999
7. $150000 - $249999
8. $250000 - $349999
9. $350000 - $499999
Over $500000
Net Worth
1. $1 - $99999
2. $100000 - $199999
3. $200000 - $499999
4. $500000 - $749999
5. $750000 - $999999
6. $1000000 - $1999999
Over $2000000
Liquid Assets
1. $1 - $25000
2. $25000 - $49999
3. $50000 - $99999
4. $100000 - $249999
5. $250000 - $499999
6. $500000 - $999999
7. $1000000 - $1999999
8. $2000000 - $2999999
Over $3000000

Demographics
Generation
Baby boomers (US)
Generation X
Millennials

Demographics
Home
Home Ownership
First time home buyer
Homeowners
Renters
Home Type
Multi-family home
Single
Household Composition
Grandparents
Member of a family-based household
Member of a housemate-based household
New parents
Veterans in home
Working women
Young & hip
Young adults in home

Demographics
Life Events
Anniversary
Anniversary in 31-60 days
Anniversary within 60 days
Away from family
Away from home
Date of birth
Month of birth
January
February
March
April
May
June
July
August
September
October
November
December
Upcoming birthday
Friends of
Close friends of men with a birthday in 0-7 days
Close friends of men with a birthday in 7-30 days
Close friends of people with their birthday in 0-7 days
Close friends of people with their birthday in 7-30 days
Close friends of women with a birthday in 0-7 days
Close friends of women with a birthday in 7-30 days
Friends of Newly Engaged
Friends of Newlywed
Friends of Recently Moved
Long distance relationship
New job
New relationship
Newly engaged (1 year)
Newly engaged (3 months)
Newly engaged (6 months)
Newlywed (1 year)
Newlywed (3 months)
Newlywed (6 months)
Recently moved

Demographics
Parents
All Parents
Parents (All)
New Parents (0-12 months)
Parents with adult-children (18-26 years of age)
Parents with pre-teens (8-12 years of age)
Parents with teenagers (13-18 years of age)
Parents with toddlers (1-2 years of age)
Parents with young children (3-5 years of age)
Parents with early school age children(6-8 age)
Moms
Big-city moms
Corporate moms
Fit moms
Green moms
Moms of grade school kids
Moms of high school kids
Moms of preschool kids
New Moms
Soccer moms
Stay-at-home moms
Trendy moms

Demographics
Politics (US)
Likely to engage with political content (conservative)
Likely to engage with political content (liberal)
Likely to engage with political content (moderate)
Self reported
Donate to conservative political causes
Donate to liberal political causes
US politics (conservative)
US politics (liberal)
US politics (moderate)
US politics (very conservative)
US politics (very liberal)

Demographics
Relationship
Interested in
Men
Women
Men and Women
Unspecified
Relationship Status
Civil partnership
Complicated
Divorced
Domestic partnership
Engaged
In a relationship
Married
Open relationship
Separated
Single
Unspecified
Widowed

Demographics
Work
Employers*
Industries
Administrative
Architecture and engineering
Arts, entertainment, sport and media
Business and financial operations
Cleaning and maintenance
Community and social services
Computers and mathematics
Construction and extraction
Education and libraries
Farming, fishing and forestry
Food preparation and services
Government employees
Healthcare and medical
IT and technical
Installation and repair
Legal
Life, physical and social sciences
Management
Military
Nurses
Personal care
Production
Protective service
Sales
Transport and moving
Veterans (US)
Job Titles*
Office Type
Small business
Category
Interests
2

Interests
Entertainment
Films
Action films
Animated films
Anime films
Bollywood films
Comedy films
Documentary films
Drama films
Fantasy films
Horror films
Musical theatre
Science fiction films
Thriller films
Games
Action games
Board games
Browser games
Card games
Casino games
First-person shooter games
Gambling
Massively multiplayer online games
Massively multiplayer online-role playing games
Online games
Online poker
Puzzle video games
Racing games
Role-playing games
Shooter games
Simulation games
Sports games
Strategy games
Video games
Word games
Life events
Ballet
Bars
Concerts
Dancehalls
Music festivals
Nightclubs
Parties
Plays
Theatre
Music
Blues music
Classical music
Country music
Dance music
Electronic music
Gospel music
Heavy metal music
Hip hop music
Jazz music
Music videos
Pop music
Rhythm and blues music
Rock music
Soul music
Reading
Books
Comics
Fiction books
Literature
Magazines
Manga
Mystery fiction
Newspapers
Non-fiction books
Romance novels
Ebooks
Television programme
TV chat shows
TV comedies
TV game shows
TV reality shows

Interests
Family & Relationships
Dating
Family
Fatherhood
Friendship
Marriage
Motherhood
Parenting
Weddings

Interests
Fitness and wellness
Bodybuilding
Dieting
Gyms
Meditation
Nutrition
Physical exercise
Physical fitness
Running
Weight training
Yoga
Zumba

Interests
Food and drink
Alcoholic drink
Beer
Distilled drink
Wine
Beverages
Coffee
Energy drinks
Juice
Soft drinks
Tea
Cooking
Baking
Recipes
Cuisine
Chinese cuisine
French cuisine
German cuisine
Greek cuisine
Indian cuisine
Italian cuisine
Japanese cuisine
Korean cuisine
Latin American cuisine
Mexican cuisine
Middle Eastern cuisine
Spanish cuisine
Thai cuisine
Vietnamese cuisine
Food
Barbecue
Chocolate
Desserts
Fast food
Organic food
Pizza
Seafood
Veganism
Vegetarianism
Restaurants
Coffeehouses
Diners
Fast casual restaurants
Fast food restaurants

Interests
Hobbies and activities
Arts and music
Acting
Crafts
Dance
Drawing
Drums
Fine art
Guitar
Painting
Performing arts
Photography
Sculpture
Singing
Writing
Current events
Home and garden
DIY
Do it yourself (DIY)
Furniture
Gardening
Home appliances
Pets
Birds
Cats
Dogs
Fish
Horses
Pet food
Rabbits
Reptiles
Politics and social issues
Charity and causes
Community issues
Environmentalism
Law
Military
Politics
Religion
Sustainability
Veterans
Volunteering
Travel
Adventure travel
Air travel
Beaches
Car rentals
Cruises
Ecotourism
Holidays
Hotels
Lakes
Mountains
Nature
Theme parks
Tourism
Vehicles
4x4s
Automobiles
Boats
Electric vehicle
Hybrids
Lorries
Motorcycles
Motorhomes
People carriers
Scooters

Interests
Shopping and Fashion
Beauty
Beauty salons
Cosmetics
Fragrances
Hair products
Spas
Tattoos
Clothing
Children’s clothing
Men’s clothing
Shoes
Women’s clothing
Fashion accessories
Dresses
Handbags
Jewellery
Sunglasses
Shopping
Boutiques
Coupons
Discount shops
Luxury goods
Online shopping
Shopping centers
Toys

Interests
Sports and outdoors
Outdoor recreation
Boating
Camping
Fishing
Hiking
Horseback riding
Hunting
Mountain biking
Surfing
Sports
American football
Baseball
Basketball
Car racing
College football
Football
Golf
Marathons
Skiing
Snowboarding
Swimming
Tennis
Triathlons
Volleyball

Interests
Technology
Computers
Computer memory
Computer monitors
Computer processors
Computer servers
Desktop computers
Free software
Hard drives
Network storage
Software
Tablet computers
Consumer electronics
Audio equipment
Camcorders
Cameras
GPS devices
Game consoles
Mobile phones
Portable media players
Projectors
Smartphones
Televisions
eBook readers

Interests
Business And Industry
Advertising
Agriculture
Architecture
Aviation
Banking
Investment banking
Online banking
Retail banking
Business
Construction
Economics
Engineering
Design
Fashion design
Graphic design
Interior design
Entrepreneurship
Healthcare
Higher Education
Management
Marketing
Nursing
Online
Digital marketing
Display advertising
Email marketing
Online advertising
Search engine optimisation
Social media
Social media marketing
Web design
Web development
Web hosting
Personal finance
Credit cards
Insurance
Investment
Mortgage loans
Property
Retail
Sales
Science
Small business
Category
Behaviour
3

Behaviour
Anniversary
Anniversary in 61-90 days

Behaviour
Automotive
Motorcycle
Purchased
New
Used
New vehicle buyers (Near market)
Style
Crossover
Economy/compact
Full-size SUV
Full-size sedan
Hybrid/alternative fuel
Luxury SUV
Luxury sedan
Midsize car
Minivan
Pickup truck
Small/midsize SUV
Sports car/convertible
New vehicle shoppers (In market)
Make
Acura
Audi
BMW
Buick
Cadillac
Chevrolet car
Chevrolet truck
Chrysler
Dodge RAM
Flat
Ford car
Ford truck
GMC
Honda
Hyundai
Infiniti
Jaguar
Jeep
Kia
Land Rover
Lexus
Lincoln
MINI
Mazda
Mercedes-Benz
Mitsubishi
Nissan
Porsche
Subaru
Toyota
Volkswagen
Volvo
New vehicle shoppers (Max in market)
All
Style
Crossover
Economy/compact
Full-size SUV
Full-size sedan
Hybrid/alternative fuel
Luxury SUV
Luxury sedan
Midsize car
Minivan
Pickup truck
Small/midsize SUV
Sports car/convertible
Owners
Aftermarket
Auto parts
Auto parts and accessories
Auto service buyer
Make
Acura
Audi
BMW
Buick
Cadillac
Chevrolet car
Chevrolet truck
Chrysler
Dodge RAM
Flat
Ford car
Ford truck
GMC
Honda
Hyundai
Infiniti
Jaguar
Jeep
Kia
Land Rover
Lexus
Lincoln
MINI
Mazda
Mercedes-Benz
Mitsubishi
Nissan
Porsche
Subaru
Toyota
Volkswagen
Volvo
Purchased
0-6 months
13-24 months ago
25-36 months ago
37-48 months ago
7-12 months ago
Over 48 months ago
Style
Crossover
Economy/compact
Full-size SUV
Full-size sedan
Hybrid/alternative fuel
Luxury SUV
Luxury sedan
Midsize car
Minivan
Pickup truck
Small/midsize SUV
Sports car/convertible
Vehicle age
0 - 1 year old
11 - 15 years old
16 - 20 years old
2 years old
3 years old
4 - 5 years old
6 - 10 years old
Over 20 years old
Vehicle price
$20,000 - $30,000
$30,000 - $40,000
$40,000 - $50,000
$50,000 - $75,000
Less than $20,000
Over $75,000
Purchase type
Vehicle price
Buy new (In market)
Buy new (Near market)
Buy new or used (In market)
Buy new or used (Near market)
Buy used (In market)
Lease (In market)
Used vehicle buyers (In market)

Behaviour
B2B
Company size
1,000 - 4,999 Employees
10 - 49 Employees
100 - 499 Employees
5,000+ Employees
50-99 Employees
500-999 Employees
Less Than 10 Employees
Industry
Agriculture
Business Services
Construction
Consumer Services
Cultural & Recreation
Education
Finance
Government
Healthcare
Hospitality & Travel
Insurance
Legal
Logistics & Transportation
Manufacturing
Media & Internet
Real Estate
Restaurant
Retail
Telecommunications
Wholesale Trade
Seniority
Executive/C-Suite
Mid-Management
Charitable donations
All charitable donations
Animal welfare
Arts and cultural
Cancer Causes
Children’s Causes
Environmental and wildlife
Health
Political
Veterans

Behaviour
Consumer classification
Brazil
(A+B) affinity for high-value goods - Brazil
India
(A) affinity for high-value goods, in India
(A+B) affinity for high-value goods, in India
South Africa
(5,6,7) Affinity for Mid Value Goods - South Africa
(8,9,10) Affinity for High Value Goods - South Africa

Behaviour
Digital Activities
Canvas Gaming
Average Engagement
Played game in last 14 days
Played game in last 3 days
Played game in last 7 days
Played game yesterday
Console gamers
Early technology adopters
Event creators
FB Payments (all)
FB Payments (higher than average spend)
FB Payments (recent)
Facebook Page Admins
Internet Browser Used
Primary Browser: Chrome
Primary Browser: Firefox
Primary Browser: Internet Explorer
Primary Browser: Opera
Primary Browser: Safari
Primary Browser: Edge
Late technology adopters
Operating System Used
Primary OS Mac OS X
Primary OS Windows 7
Primary OS Windows 8
Primary OS Windows Vista
Primary OS Windows XP
Sierra OS Mac
Operating system used
Primary OS Windows 10
Photo Uploaders
Primary email domain
AOL Email Addresses
Apple EMail Addresses
Gmail Users
Hotmail Email Addresses
MSN.com Email Addresses
Yahoo Email Addresses
Small Business Owners

Behaviour
Expats
Close friends of ex-pats
Ex-pats (Argentina)
Ex-pats (Australia)
Ex-pats (Austria)
Ex-pats (Bangladesh)
Ex-pats (Belguim)
Ex-pats (Cameroon)
Ex-pats (Canada)
Ex-pats (Chile)
Ex-pats (Colombia)
Ex-pats (Cuba)
Ex-pats (Dominican Republic)
Ex-pats (El Salvador)
Ex-pats (Ethiopia)
Ex-pats (Finland)
Ex-pats (France)
Ex-pats (Germany)
Ex-pats (Ghana)
Ex-pats (Greece)
Ex-pats (Guatemala)
Ex-pats (Haiti)
Ex-pats (Honduras)
Ex-pats (Hong Kong)
Ex-pats (Ireland)
Ex-pats (Israel)
Ex-pats (Italy)
Ex-pats (Japan)
Ex-pats (Kenya)
Ex-pats (Latvia)
Ex-pats (Malaysia)
Ex-pats (Mexico)
Ex-pats (Morocco)
Ex-pats (Nepal)
Ex-pats (New Zealand)
Ex-pats (Nigeria)
Ex-pats (Peru)
Ex-pats (Poland)
Ex-pats (Portugal)
Ex-pats (Puerto Rico)
Ex-pats (Romania)
Ex-pats (Russia)
Ex-pats (Rwanda)
Ex-pats (Saudi Arabia)
Ex-pats (Senegal)
Ex-pats (Serbia)
Ex-pats (Singapore)
Ex-pats (South Korea)
Ex-pats (Spain)
Ex-pats (Sri Lanka)
Ex-pats (Switzerland)
Ex-pats (UAE)
Ex-pats (UK)
Ex-pats (Uganda)
Ex-pats (United States)
Ex-pats (Venezuela)
Ex-pats (Vietnam)
Ex-pats (Zimbabwe)
Ex-pats (the Netherlands)
Ex-pats (the Philippines)
Expats (All)
Expats (Brazil)
Expats (China)
Expats (Estonian)
Expats (Hungary)
Expats (India)
Expats (Indonesia)
Expats (South Africa)
Family of ex-pats

Behaviour
Financial
Banking
Credit union member
Investments
Full-Service Investors
Highly likely Investors
Independent Investors
Likely investors
Personal investments
Real estate investments
Semi-independent investors
Spending methods
1 Line of Credit
2 Lines of Credit
3 Lines of Credit
4 Lines of Credit
5 Lines of Credit
6 Lines of Credit
7 Lines of Credit
8 Lines of Credit
9 Lines of Credit
Active credit card user
Any card type
Bank cards
Gas, department and retail store cards
High-end department store cards
Premium credit cards
Primarily cash
Primarily credit cards
Travel and entertainment cards

Behaviour
Job Role
Corporate executives
Farmers
Financial professionals

Behaviour
Media
Radio
Internet
Internet/Satellite
Television
Show Genre
Action shows
Adventure shows
Animal shows
Auto Racing shows
Auto shows
Baseball shows
Biography shows
Children’s shows
Comedy shows
Cooking shows
Docudrama shows
Drama shows
Educational shows
Entertainment shows
Health shows
Historical Drama shows
History shows
Home improvement shows
Horror shows
Law shows
Motorsports shows
News shows
Outdoors shows
Public Affairs shows
Reality shows
Religious shows
Romance shows
Science Fiction shows
Sitcom shows
Sports Events shows
Sports Talk shows
Travel shows
Western shows
Viewership Habits
Heavy US TV Viewers
Light US TV Viewers
Moderate US TV Viewers

Behaviour
Mobile device user
All Mobile Devices by Brand
Alcatel
Amazon
Kindle Fire
Apple
iPad 1
iPad 2
iPad 3
iPad 4
iPad Air
iPad Air 2
iPad Mini 1
iPad Mini 2
iPad Mini 3
iPhone 4
iPhone 4S
iPhone 5
iPhone 5C
iPhone 5S
iPhone 6
iPhone 6 Plus
iPhone 6S
iPhone 6S Plus
iPhone 7
iPhone 7 Plus
iPhone SE
iPod Touch
Cherry Mobile
Gionee devices
Google
Google Pixel
Nexus 5
HTC
HTC One
Huawei
Karbonn
LG
G3
LG G2
LG V10
Micromax
Motorola
Samsung
Galaxy Grand
Galaxy Grand 2
Galaxy Note 3
Galaxy Note 4
Galaxy Note 5
Galaxy Note 7
Galaxy S 4 Mini
Galaxy S III
Galaxy S III Mini
Galaxy S4
Galaxy S5
Galaxy S6
Galaxy S7
Galaxy S7 Edge
Galaxy Tab 2
Galaxy Tab 3
Galaxy Tab 4
Galaxy Tab Pro
Galaxy Tab S
Galaxy Y
Samsung Galaxy S8
Sony
Xperia M
Xperia Z
Xperia Z Ultra
Xperia Z3
Tecno
Xiaomi
ZTE
All Mobile Devices by Operating System
All Android devices
All iOS devices
Windows Phones
All mobile devices
Feature phones
Network connection
2G Connection
3G Connection
4G Connection
Wi-Fi Connection
New smartphone and tablet owners
Primary Android device is eligible for media
Primary Android device is ineligible for media
Smartphone Owners
Smartphones and tablets
Tablet Owners

Behaviour
Multicultural affinity
African American (US)
Asian-American (US)
Hispanic (US - All)
Hispanic (US - Bilingual)
Hispanic (US - English dominant)
Hispanic (US - Spanish dominant)

Behaviour
Purchase behaviour
Business purchases
Business marketing
Buyer profiles
Coupon users
DIYers
Fashionistas
Foodies
Gadget enthusiast
Gamers
Green living
Healthy and fit
Outdoor enthusiasts
Shoppers
Skiing, golfing and boating
Spa enthusiasts
Sportsmen
Trendy homemakers
Clothing
Men’s
Accessories
Big and tall apparel
Business apparel
Jeans
Men’s fashion & apparel buyers
Seasonal
Winter seasonal shoppers
Women’s
Accessories
Business apparel
Fine jewelry
Jewelry
Low-ticket apparel and accessories
Luxury brand apparel
Luxury retailers
Mid-ticket apparel and accessories
Plus sizes
Women’s shoes
Women’s fashion & apparel buyers
Young women’s apparel
Food and drink
Alcoholic beverages
Beer
Craft beer
Domestic beer
Import beer
Light beer
Premium beer
Spirits
Wine
Bakery
Bakery products
Beverages
Bottled water
Carbonated drinks
Coffee
Coffee (K-Cup)
Diet drinks
Energy drinks
Hot tea
Iced tea and lemonade
Juice
Non-dairy milk
Sports drinks
Cereal
All cereal
Children’s cereals
Fibre cereals
Hot cereals
Children’s food
Baby food and products
Children’s food
Children’s food and products
Condiments and dressings
Condiments
Salad dressings
Cooking supplies
Baking
Spices
Dairy and eggs
Cheese
Dairy free
Eggs
Milk
Yogurt
Fresh & Healthy
Fresh & healthy
Frozen food
Frozen appetisers & snacks
Frozen bread & dough
Frozen breakfast
Frozen desserts
Frozen entrees
Frozen ethnic foods
Frozen fruit
Frozen meats and seafood
Frozen pasta
Frozen pizza
Frozen vegetables
Ice cream and novelties
Grocery shopper type
Premium brand groceries
Top spenders
Health food
Diet foods
Fresh produce
Low-fat foods
Natural and organics
Home Cooking & Grilling
Home cooking & grilling
Meat and seafood
Meat
Seafood
Soup
Soup
Sweets and snacks
Breakfast bars
Chocolate candy
Cookies
Crackers
Granola bars
Non-chocolate candy
Peanut butter and jelly
Salty snacks
Vegetarian
Vegetarian
Health and beauty
Allergy relief
Antiperspirants & deodorants
Cosmetics
Cough and cold relief
Fragrance
Hair care
Health & wellness buyers
Men’s grooming
Oral care
Over-the-counter medication
Pain relief
Skin care
Sun care
Vitamins
Home and garden
Entertaining
Home improvement
Home renovation
Organisation
Tools
Household products
Cleaning supplies
Food storage
Green cleaners and supplies
Laundry supplies
Kids products
Baby care
Baby toys
Pet products
Cat food
Cat owners
Cat products
Dog food
Dog owners
Dog products
Pet care products
Pet products
Purchase types
Appliances & accessories
Arts and crafts
Baby products
Beauty accessories
Children’s apparel
Consumer electronic buyers
Cosmetics
Home furnishing and accessories
Home office
Restaurant
Fine dining
Mid-range restaurants/non quick serve
Quick serve restaurants
Small and home office products
Software
Toys
Travel supplies
Upscale travel and services
Women’s apparel
Sports and outdoors
Cycling
Fishing
Fitness
Golf and tennis
Hiking and camping
Hunting
Running
Winter sports
Store types
Department stores
Discount department store
Gift shoppers
Gyms & fitness clubs
High-end retail
Low-end department store
Luxury store
Subscription services
Auto insurance online
Higher education
Mortgage online
Prepaid debit cards
Satellite TV
Technology
Kindle eReader
Use an eReader
Engaged Shoppers]`;