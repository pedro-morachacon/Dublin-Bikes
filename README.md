# Comp30830GroupProject
COMP30830 Software Engineering Bike Rentals App Group Project

Collaborators:
   Xiuping Xue,
   An Xuhui, &
   Pedro Antonio Mora Chacón
   
   Dublin Bike App is an app to help users make an informed decision on which JCDecaux bike station to use in Dublin. The App will present the user the average number of bikes available on nearby stations based on wheather, the day of the week and time. 
   
   The Group project will have an AWS ECS web scraping component to accumulate historical data for both weather and bike stations. It will also include an AWS RDS database component to store the accumulated data and perform data queries. Lastly, it will also include a client side component that serves as the user interface.  
-----
# Dublin Bikes Project Overview 

## Introduction 

Our project aims at providing additional features / services to the users of bicycle rental provider Dublinbikes. The use of bicycles is a convenient way to commute to the city where parking is often scarce and petrol prices are high. Providing additional features like future bicycle journey stations’ bicycle / stands predictions and weather forecasts might be of interest to their clients considering the increasing city cyclist trends. 

The annual National Transport Canal Gordon report is a detailed account of “traffic counts at 33 locations around the cordon formed by the Royal and Grand Canals. The counts are conducted during the month of November each year. Since 1997 the counts have been conducted over the AM peak period between 07:00 and 10:00.” (The National Transport Authority, 2022) This annual report covers roughly the same area as the one covered by the bicycle rental provider Dublinbikes.  

Their 2021 Gordon report highlights that in Dublin, the use of bikes has been steadily increasing while the use of cars has been declining steadily except for the years impacted by COVID. (The National Transport Authority, 2022) During 2020 and portions of 2021 there were lockdown restrictions which had an immediate impact as only essential activities were permitted for the benefit of the general public’s welfare. Even now in 2023, many employers continue to offer their personnel hybrid remote work models in an attempt to accommodate for lingering COVID circumstances.

According to the report, " There had been a steady year on year growth in the number of cyclists crossing the cordon since 2010 with the exception of a slight dip in 2018 until 2019. In 2021, a downward shift was observed with 7,597 cyclists crossing the cordon in the AM peak period. Even with these lower numbers in 2021, this still represents a significant growth of 57% when compared with 2006." (The National Transport Authority, 2022)

These trends speak favorably to increasing demand of bicycle rental services in general and the increased probability that at some point it may be valuable for their clients to be able plan their journeys ahead of time. 

## Target User and Objectives

The target audience for this app includes individuals who are looking for real-time and forecasted weather information for a specific location, as well as those who are interested in monitoring the availability of bicycles at bicycle stations based on weather conditions. This may include commuters, travelers, motorists, and other individuals who rely on weather-related information and each bicycle station’s availability to plan their journeys effectively. The app may also cater to users who are concerned about weather-related impacts on bicycle availability at bicycle stations, such as during extreme weather events or seasonal variations. Additionally, the app may be useful for individuals who prefer to use shared or public transportation and need to know the availability of bicycles at specific bicycle stations for their travel plans. Overall, the app aims to provide valuable information to a wide range of users who are seeking accurate and timely weather and bicycle station availability updates to enhance their travel experience.

## Features

1. Provide real-time and forecast information: The app aims to provide users with up-to-date and accurate information on the availability of bicycles and the number of bicycle stands at specific stations presently, or what would be based on travel time and weather forecast. This information allows users to plan their journeys more effectively and make informed decisions about their travel options.

2. Enhance user experience: The app is designed to be user-friendly and intuitive, with a user-friendly interface that allows users to easily access the information they need. The app's layout, navigation, and features are designed to provide a seamless and convenient experience for users, making it easy for them to obtain the information they need quickly and efficiently.

3. Improve travel planning: The app aims to assist users in planning their journeys by providing them with accurate travel time estimates based on real-time data. This allows users to better anticipate travel times and plan their trips accordingly, helping them to avoid delays and disruptions.

4. Increase awareness of weather conditions: The app aims to raise awareness among users about the current weather conditions in Dublin, providing them with real-time weather updates. This information allows users to plan their journeys more effectively, taking into consideration weather conditions such as rain, snow, or extreme temperatures

5. The app offers users access to real-time and 5-day weather conditions, along with comprehensive status updates for each bicycle station as they are influenced by the local weather conditions. This includes valuable information such as the number of available bicycles and the number of bicycle stands (or bicycle parking spaces) that are currently available. By providing this detailed data, the app empowers users with up-to-date information to make informed decisions about their travel plans, taking into consideration the weather conditions and the availability of bicycles at their desired bicycle station. Whether it's checking the weather forecast for the next week or planning for available parking options, this feature-rich app ensures that users have the most relevant and timely information at their fingertips to make their bicycle rental experience more convenient and efficient.


## Retrospective 

### Overall Project Assessment 

This project was very difficult and required mental and emotional effort. At the beginning of the project, none of us had used AWS, Flask, APIs and all the development tools that this simple project required. It was like we were all incoming student wizards at Hogwarts, except we were all Harry Potter because none of us came with a background in programming. Harry would be dead without Hermione. Gone. However, without Hermione we got it done and we are proud of the _final Dublin Bikes App! The App does a great job on the server client communications, managing the APIs and going from MySQL database tables to predictions ready for the user. As mentioned, we are new at this so there were some challenges. Teams in the workforce face a real challenge when putting together a new product, so for us, learning the tools required all the while there is an expectation to deliver the product was very demanding and this is without taking into account the other five modules on our graduate course. We met the challenge by learning about web frameworks and the other technologies with a smile on our faces because we were not giving up! We did not give up when other situations presented themselves. In challenges like the moment we were made aware that we should probably switch from Mapbox to Google Maps, or when we realized that the navigation feature would cost money and needed to be replaced with other features. These were learning moments that emphasized the need to not ignore any obstacles, address them as soon as it is feasible to do so and be transparent, communicate with your teammates. Pedro was having trouble getting the app to work on his PC and so he was open about it, and working together they were able to decipher that the App needed an earlier version of SQLAlchemy. It was a vulnerable moment that became an opportunity for team bonding! 

### Future Work 
One idea to implement in the future was to hide the three status charts for the bike station selected until the user clicks display button and then for the idle time before the charts load, show a loading icon first. Another idea was having a separate input for the destination bike station and displaying instead a prediction bike availability chart for the starting station.

