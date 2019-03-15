// Library to send signal to Q keyboards
const q = require('daskeyboard-applet');

// Library to send request to API
const request = require('request-promise');

var dateFormat = require('dateformat');

const logger = q.logger;

const baseUrl = 'https://daskeyboard.mojohelpdesk.com/api/tickets/search?query=';

function getUtcTime() {
  console.log("let's get the date");
  var now = new Date();
  var utcTime = dateFormat(now, "isoUtcDateTime");
  return utcTime;
}

function isEmpty(obj) {
  for(var key in obj) {
      if(obj.hasOwnProperty(key))
          return false;
  }
  return true;
}


class MojoHelpdesk extends q.DesktopApp {
  constructor() {
    super();
    // run every min
    this.pollingInterval = 60000;
    this.serviceUrl = "";
    this.message = "";
  }

  async applyConfig() {
    logger.info("Initialisation. Let's configure the url.")
    switch(this.config.option){
      case "nuut":
        this.serviceUrl = baseUrl + 'priority.id:\(\%3C=20\)%20AND%20created_on:['+getUtcTime()+'%20TO%20*]%20AND%20assignee.id:\(\%3C=0\)\&sf=created_on&r=1&access_key='+this.authorization.apiKey;
        this.message = "New unassigned urgent ticket";
        break;
      case "nut":
        this.serviceUrl = baseUrl + 'created_on:['+getUtcTime()+'%20TO%20*]%20AND%20assignee.id:\(\%3C=0\)\&sf=created_on&r=1&access_key='+this.authorization.apiKey;
        this.message = "New unassigned ticket";
        break;
      case "ntatm":
        this.serviceUrl = baseUrl + 'updated_on:['+getUtcTime()+'%20TO%20*]%20AND%20assignee.name:\('+this.config.firstName+'\)\&sf=created_on&r=1&access_key='+this.authorization.apiKey;
        this.message = "New ticket assigned to me";
        break;
      default:
        logger.error("Config issue.")
    }
    logger.info("serviceUrl AFTER CONFIG")
    logger.info(this.serviceUrl)
  }

  updateUrlWithRightTime(){
    logger.info("Let's update the url with the right time.")
    switch(this.config.option){
      case "nuut":
        this.serviceUrl = baseUrl + 'priority.id:\(\%3C=20\)%20AND%20created_on:['+getUtcTime()+'%20TO%20*]%20AND%20assignee.id:\(\%3C=0\)\&sf=created_on&r=1&access_key='+this.authorization.apiKey;
        break;
      case "nut":
        this.serviceUrl = baseUrl + 'created_on:['+getUtcTime()+'%20TO%20*]%20AND%20assignee.id:\(\%3C=0\)\&sf=created_on&r=1&access_key='+this.authorization.apiKey;
        break;
      case "ntatm":
        this.serviceUrl = baseUrl + 'updated_on:['+getUtcTime()+'%20TO%20*]%20AND%20assignee.name:\('+this.config.firstName+'\)\&sf=created_on&r=1&access_key='+this.authorization.apiKey;
        break;
      default:
        logger.error("Config issue.")
    }
  }

  // call this function every pollingInterval
  async run() {

    logger.info("Let's running.")
    // this.wantedUrl = 'https://daskeyboard.mojohelpdesk.com/api/tickets/search?query=priority.id:\(\%3C=20\)%20AND%20created_on:['+getUtcTime()+'%20TO%20*]%20AND%20assignee.id:\(\%3C=0\)\&sf=created_on&r=1&access_key=98d98ea4bf8495561dea27b8a45e83c5bbf53c16'
    // test
    // this.wantedUrl = 'https://daskeyboard.mojohelpdesk.com/api/tickets/search?query=priority.id:\(\%3C=20\)%20AND%20created_on:[2007-06-09T22:46:21Z%20TO%20*]%20AND%20assignee.id:\(\%3C=0\)\&sf=created_on&r=1&access_key=98d98ea4bf8495561dea27b8a45e83c5bbf53c16'

    logger.info("Aimed url" + this.serviceUrl);

    return request.get({
        url: this.serviceUrl,
        json: false
      }).then((body) => {
        logger.info("Looking for Mojo Helpdesk data");
        let signal;

        // Test if there is something inside the response
        var isBodyEmpty = isEmpty(body) || (body === "[]");


        if(isBodyEmpty){
          logger.info("No new tickets.")
          signal = null;
        }else{
          console.log(JSON.stringify(body));
          logger.info("=====> New ticket available!")
          signal = new q.Signal({ 
            points:[[new q.Point(this.config.color,this.config.effect)]],
            name: "Mojo Helpdesk",
            message: this.message,
            link: {
              url: 'https://daskeyboard.mojohelpdesk.com/ma/#/tickets/search',
              label: 'Show in Mojo Helpdesk',
            }
          });
        }

        this.updateUrlWithRightTime();

        logger.info("serviceUrl AFTER UPDATE")
        logger.info(this.serviceUrl)

        return signal;
        
      })
      .catch(error => {
        logger.error(
          `Got error sending request to service: ${JSON.stringify(error)}`);
        return q.Signal.error([
          'The Mojo Helpdesk service returned an error. Please check your API key and account.',
          `Detail: ${error.message}`]);
      });
  }

}

module.exports = {
  MojoHelpdesk: MojoHelpdesk,
};

const mojoHelpdesk = new MojoHelpdesk();