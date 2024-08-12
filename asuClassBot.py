from bs4 import BeautifulSoup
from selenium import webdriver
import time
import sys


def checkOpenSeats(classNumber):
    # Set up the Selenium WebDriver
    chrome_options = webdriver.ChromeOptions()
    chrome_options.add_argument('--log-level=3') 
    driver = webdriver.Chrome(options=chrome_options)

    # Open the desired URL
    urlTemp = "https://catalog.apps.asu.edu/catalog/classes/classlist?campusOrOnlineSelection=A&honors=F&keywords={}&promod=F&searchType=all&term=2247"
    url = urlTemp.format(classNumber)
    driver.get(url)

    # Time for it to load the webpage, increase if slow wifi
    time.sleep(1)

    # Get the page source
    html_content = driver.page_source

    # Parse the page source with BeautifulSoup
    soup = BeautifulSoup(html_content, 'html.parser')

    # Get all elements with the classes 'seats' and 'text-nowrap'
    seatElements = soup.select('.seats .text-nowrap')
    seatCounts = [seat.get_text() for seat in seatElements]
    driver.quit()

    if len(seatCounts) == 0:
        return "Class does not exist"

    # Print the text of each selected element
    for seat in seatCounts:
        #print("String is: " + seat)
        if int(seat[0]) > 0:
            print("Open")
        else:
            print("Closed")

# string
input = sys.argv[1]
checkOpenSeats(input)

sys.stdout.flush()

