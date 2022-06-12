
    /* exported gapiLoaded */
    /* exported gisLoaded */
    /* exported handleAuthClick */
    /* exported handleSignoutClick */

    // TODO(developer): Set to client ID and API key from the Developer Console 
    //see readme file
    const CLIENT_ID = 'your_client_id';
    const API_KEY = 'your_api_key';

    // Discovery doc URL for APIs used by the quickstart
    const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';

    // Authorization scopes required by the API; multiple scopes can be
    // included, separated by spaces.
    const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';

    let tokenClient;
    let gapiInited = false;
    let gisInited = false;


    document.getElementById('signout_button').style.display = 'none';

    /**
     * Callback after api.js is loaded.
     */
    function gapiLoaded() {
      gapi.load('client', intializeGapiClient);
    }

    /**
     * Callback after the API client is loaded. Loads the
     * discovery doc to initialize the API.
     */


    async function intializeGapiClient() {
      await gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: [DISCOVERY_DOC],
      });
      gapiInited = true;
      maybeEnableButtons();
    }

    /**
     * Callback after Google Identity Services are loaded.
     */
    function gisLoaded() {
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: '', // defined later
      });
      gisInited = true;
      maybeEnableButtons();
    }

    /**
     * Enables user interaction after all libraries are loaded.
     */
    function maybeEnableButtons() {
      if (gapiInited && gisInited) {
        document.getElementById('loader').style.display = 'none';
        handleAuthClick();
      }

    }

    /**
     *  Sign in the user upon button click.
     */
    function handleAuthClick() {
      tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) {
          throw (resp);
        }
        document.getElementById('signMsg').style.display = 'none';
        document.getElementById('EventData').style.display = 'block';
        document.getElementById('signout_button').style.display = 'block';
        document.getElementById('authorize_button').style.display = 'none';
      };



      if (gapi.client.getToken() === null) {
        // Prompt the user to select a Google Account and ask for consent to share their data
        // when establishing a new session.
        tokenClient.requestAccessToken({ prompt: 'consent' });
      } else {
        // Skip display of account chooser and consent dialog for an existing session.
        tokenClient.requestAccessToken({ prompt: '' });
      }



    }

    /**
     *  Sign out the user upon button click.
     */
    function handleSignoutClick() {
      const token = gapi.client.getToken();
      if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token);
        gapi.client.setToken('');
        document.getElementById('content').innerHTML = '<span>Select date to see you events.....</span>';
        document.getElementById('availableTime').innerHTML = '<div>Select dates to see events</div>';
        document.getElementById("event_dates").reset();
        document.getElementById('signMsg').style.display = 'block';
        document.getElementById('EventData').style.display = 'none';
        document.getElementById('authorize_button').style.display = 'block';
        document.getElementById('signout_button').style.display = 'none';
        document.getElementById('copyBtn').style.display = 'none';
      }
    }


    var delay = 60 * 60 * 1000;
    setInterval(() => {
      handleSignoutClick()
    }, delay);


    /**
     * Print the summary and start datetime/date of the next ten events in
     * the authorized user's calendar. If no events are found an
     * appropriate message is printed.
     */

    function getDay(day) {
      const weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      return weekday[new Date(day).getDay()];
    }

    function getTime(time) {
      let times = new Date(time);
      return times.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }).replace(/ /g,'').toLowerCase()
    }

    function msToTime(ms) {
      let seconds = (ms / 1000).toFixed(2);
      let minutes = (ms / (1000 * 60)).toFixed(2);
      let hours = (ms / (1000 * 60 * 60)).toFixed(2);
      let days = (ms / (1000 * 60 * 60 * 24)).toFixed(1);
      if (seconds < 60) return seconds + " Seconds";
      else if (minutes < 60) return minutes + " Minutes";
      else if (hours < 24) {
        if (hours > 1) {
          return hours + " Hours";
        } else {
          return hours + " Hour";
        }
      }
      else return days + " Days"
    }

    function dateFormat(inputDate, format) {
        //parse the input date
        const date = new Date(inputDate);
  
        //extract the parts of the date
        const day = date.getDate();
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
  
        //replace the month
        format = format.replace("MM", month.toString().padStart(2, "0"));
  
        //replace the year
        if (format.indexOf("yyyy") > -1) {
          format = format.replace("yyyy", year.toString());
        } else if (format.indexOf("yy") > -1) {
          format = format.replace("yy", year.toString().substr(2, 2));
        }
  
        //replace the day
        format = format.replace("dd", day.toString().padStart(2, "0"));
  
        return format;
    }

    
    var contentElement = document.getElementById('content');
    var availableTimeElement = document.getElementById('availableTime');
   
    document.querySelector("#event_dates").addEventListener("submit", function (e) {
      e.preventDefault();    //stop form from submitting
      listUpcomingEvents(); 
      contentElement.innerHTML = "<div class='text-center w-100 my-5'><div class='spinner-border text-primary' role='status'> <span class='visually-hidden'>Loading...</span> </div></div>";
      availableTimeElement.innerHTML = "<div class='text-center w-100 my-2'><div class='spinner-border text-primary' role='status'> <span class='visually-hidden'>Loading...</span> </div></div>";

    });

    function getOrdinalNum(n) {
        return n + (n > 0 ? ['th', 'st', 'nd', 'rd'][(n > 3 && n < 21) || n % 10 > 3 ? 0 : n % 10] : '');
    }
      

    function copyAvailableTime() {
      var textToCopy = document.getElementById('availableTime').innerText;
      navigator.clipboard.writeText(textToCopy);
      alert("Copied to clipboard");
    }

    async function listUpcomingEvents() {
      let slotStart = parseInt(document.getElementById('startTime').value);
      let slotEnd= parseInt(document.getElementById('endTime').value);
    
      let START_DATE;
      let END_DATE;
      let slotLength = parseInt(document.getElementById('freeTimeLength').value);
      let getEndDate;
      let sd = await document.getElementById('startDate');
      let ed = await document.getElementById('endDate');
      if (sd && sd.value) {
        START_DATE = new Date(sd.value);
        let getEndDate = new Date(ed.value);
        END_DATE = new Date(getEndDate.setDate(getEndDate.getDate() + 1));
      } else {
        START_DATE = new Date();
        getEndDate = new Date();
        END_DATE = new Date(getEndDate.setDate(START_DATE.getDate() + 1));
      }

      let response;
      try {
        const request = {
          'calendarId': 'primary',
          'timeMin': (START_DATE).toISOString(),
          'timeMax': (END_DATE).toISOString(),
          'showDeleted': false,
          'singleEvents': true,
          'maxResults': 100,
          'orderBy': 'startTime',
        };
        response = await gapi.client.calendar.events.list(request);
      } catch (err) {
        document.getElementById('content').innerText = err.message;
        return;
      }




      const events = response.result.items;
      //console.log('events -: ', events);
      if (!events || events.length == 0) {
        
        document.getElementById('copyBtn').style.display = 'none';
        contentElement.innerHTML = '<span>No events found.</span>';
        availableTimeElement.innerHTML = '<span>No data found.</span>';
        return;
      } else {
        //console.log('eventsevents', events)
        const setSlot = function (start, end = null) {
          //console.log('setSlot', slotTrack.start, start)
         if(!end) {
          end = moment(start).set({ 
            hour: slotEnd,
            minute:0,
            second:0,
            millisecond:0
          }).valueOf()
         }
          return {start, end}
        }
        
        const iDate = moment(START_DATE.valueOf()).set({ 
          hour: slotStart,
          minute:0,
          second:0,
          millisecond:0
        }).valueOf()
        let slotTrack = setSlot(iDate)
        // let slotTrack = {
        //   start: START_DATE.valueOf(),
        //   end: new Date(START_DATE.getTime() + (slotLength * 60000)).valueOf()
        // }
        let lastTime = '';
        let availSlots = [];
        //console.log('slotTrack.end < END_DATE.valueOf()', slotTrack.end < END_DATE.valueOf())
        while (slotTrack.end < END_DATE.valueOf()) {
          for (let i = 0; i < events.length; i++) {
            let vc = '';
            const elStart = new Date(events[i].start.dateTime).valueOf();
            const elEnd = new Date(events[i].end.dateTime).valueOf();
            if ((slotTrack.start <= elStart && slotTrack.end >= elStart) || (slotTrack.start <= elEnd && slotTrack.end >= elEnd)) {
              slotTrack.end = elStart
              if(moment(slotTrack.end).diff(slotTrack.start, 'minutes') >= slotLength) {
                availSlots.push(slotTrack);
              }
              slotTrack = setSlot(elEnd);
            }
          }
          if(moment(slotTrack.end).diff(slotTrack.start, 'minutes') >= slotLength) {
            availSlots.push(slotTrack);
          }
          const sDate = moment(slotTrack.end).add(1,'days').set({ 
            hour: slotStart,
            minute:0,
            second:0,
            millisecond:0
          }).valueOf()
          slotTrack = setSlot(sDate)
        }
        // let ttt = availSlots.map(el => {
        //   // el.start = moment(el.start).format('MMMM Do, h:mm:ss a')
        //   // el.end = moment(el.end).format('MMMM Do, h:mm:ss a')
        //   return el;
        // })
        //console.log('availSlots', ttt);

        let weekday = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
        let months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];
        let newArr = [];
        let isTimeNotfree = false;
        let newStartDate = '';
        for (let index = 0; index < availSlots.length; index++) {
          const element = availSlots[index];
          element.start = new Date(element.start);
          element.end = new Date(element.end);
          let obj = {};
          if( element.start.getDay() > 0 && element.start.getDay() <=5) {
            obj = {
              key:element.start.getMonth()+'-'+element.start.getDate(),
              date: months[element.start.getMonth()]+' '+getOrdinalNum(element.start.getDate()),
              startDate: element.start.getDate(),
              start: element.start,
              end:element.end,
              day: weekday[element.start.getDay()],
              time:getTime(element.start)+'-'+getTime(element.end)
            }
            newArr.push(obj);
          }
      }

       
       
       let outputNewArr = []
        newArr.forEach(function(item) {
            var existing = outputNewArr.filter(function(v, i) {
              return v.key == item.key;
            });
            if (existing.length) {
              var existingIndex = outputNewArr.indexOf(existing[0]);
              outputNewArr[existingIndex].time = outputNewArr[existingIndex].time.concat(item.time);
            } else {
              if (typeof item.time == 'string')
                item.time = [item.time];
                outputNewArr.push(item);
            }
        });

        //console.log(' outputNewArr.time',  outputNewArr)
        let availableTime = outputNewArr;
        contentElement.innerHTML = ' ';
        availableTimeElement.innerHTML = ' ';
        for (let index = 0; index < events.length; index++) {
          const element = events[index];
          let summary = element.summary;
          let day = getDay(element.start.dateTime);
          let from = getTime(element.start.dateTime);
          let to = getTime(element.end.dateTime);
          let date = dateFormat(element.start.dateTime, "dd-MM-yyyy");
          let applyWeekFilter = new Date(element.start.dateTime)
          if(applyWeekFilter.getDay() > 0 && applyWeekFilter.getDay() <=5) {
            contentElement.innerHTML += 
             `<div class="col-md-4 col-sm-6 col-12 p-2 my-2">
                <div  class="card shadow meet-card p-3 border border-2 border-primary"> 
                  <div class="mb-2 fw-bold font-18 border-bottom border-primary pb-2">${summary} </div> 
                  <div class='mb-2'>Date: ${date} </div>
                  <div class="mb-2">Day: ${day} </div>
                  <div class="mb-2">From: ${from} </div>
                  <div class='mb-2'>To: ${to} </div>
                </div> 
              </div>`;
          }
        }


        if (availableTime.length > 0) {
          document.getElementById('copyBtn').style.display = 'block';
          availableTime.forEach(element => {
            availableTimeElement.innerHTML +=
             `<div class='mb-2'> ${element.day + ' ' +element.date}: ${element.time.join(", ")}</div>`;
          });
        } else {
          document.getElementById('copyBtn').style.display = 'none';
          availableTimeElement.innerHTML = "<div>No data found</div>"
        }

      }
    }
