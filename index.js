// Library to send signal to Q keyboards
const q = require('daskeyboard-applet');

// Library to send request to API
const request = require('request-promise');

var dateFormat = require('dateformat');

const logger = q.logger;

const baseUrl1 = 'https://';
const baseUrl2 = '/api/tickets/search?query='

// Get the current time
function getUtcTime() {
  var now = new Date();
  var utcTime = dateFormat(now, "isoUtcDateTime");
  return utcTime;
}

// Test if an object is empty
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
  }

  async applyConfig() {

    logger.info("Initialisation.")

    return request.get({
      url: `https://app.mojohelpdesk.com/api/v3/helpdesk?access_key=${this.authorization.apiKey}`,
      json: true
    }).then((body) => {
      logger.info("Let's configure the domain name.");
      this.domain = body.domain;
      logger.info("Got domain name: "+this.domain);

      logger.info("Let's configure the serviceUrls, messages.")

      switch(this.config.option){
        case "nuut":
          this.serviceUrl = baseUrl1 + this.domain + baseUrl2 + 'priority.id:\(\%3C=20\)%20AND%20created_on:['+getUtcTime()+'%20TO%20*]%20AND%20assignee.id:\(\%3C=0\)\&sf=created_on&r=1&access_key='+this.authorization.apiKey;
          this.message = "New unassigned urgent ticket.";
          this.url = 'https://'+this.domain+'/ma/#/tickets/search?sort_field=updated_on&assignee_id=0&status_id=10,20,30,40&page=1'
          break;
        case "nut":
          this.serviceUrl = baseUrl1 + this.domain + baseUrl2 + 'created_on:['+getUtcTime()+'%20TO%20*]%20AND%20assignee.id:\(\%3C=0\)\&sf=created_on&r=1&access_key='+this.authorization.apiKey;
          this.message = "New unassigned ticket.";
          this.url = 'https://'+this.domain+'/ma/#/tickets/search?sort_field=updated_on&assignee_id=0&status_id=10,20,30,40&page=1'
          break;
        case "nuoatatm":
          this.serviceUrl = baseUrl1 + this.domain + baseUrl2 + 'updated_on:['+getUtcTime()+'%20TO%20*]%20AND%20assignee.email:\("'+this.config.email+'"\)\&sf=created_on&r=1&access_key='+this.authorization.apiKey;
          this.message = "New update on a ticket.";
          break;
        default:
          logger.error("Config issue.")
      }
  
      logger.info("serviceUrl AFTER CONFIG: "+this.serviceUrl)
    })
    .catch(error => {
      logger.error(
        `Got error sending request to service: ${JSON.stringify(error)}`);
      return q.Signal.error([
        'The Mojo Helpdesk service returned an error. Please check your API key and account.',
        `Detail: ${error.message}`]);
    });

  }

  updateUrlWithRightTime(){
    logger.info("Let's update the url with the right time.")
    switch(this.config.option){
      case "nuut":
        this.serviceUrl = baseUrl1 + this.domain + baseUrl2 + 'priority.id:\(\%3C=20\)%20AND%20created_on:['+getUtcTime()+'%20TO%20*]%20AND%20assignee.id:\(\%3C=0\)\&sf=created_on&r=1&access_key='+this.authorization.apiKey;
        break;
      case "nut":
        this.serviceUrl = baseUrl1 + this.domain + baseUrl2 + 'created_on:['+getUtcTime()+'%20TO%20*]%20AND%20assignee.id:\(\%3C=0\)\&sf=created_on&r=1&access_key='+this.authorization.apiKey;
        break;
      case "nuoatatm":
        this.serviceUrl = baseUrl1 + this.domain + baseUrl2 + 'updated_on:['+getUtcTime()+'%20TO%20*]%20AND%20assignee.email:\("'+this.config.email+'"\)\&sf=created_on&r=1&access_key='+this.authorization.apiKey;
        break;
      default:
        logger.error("Config issue.")
    }
  }

  // call this function every pollingInterval
  async run() {
    let signal;

    try {
      const body = await request.get({
        url: this.serviceUrl,
        json: true
      });

      logger.info("Looking for Mojo Helpdesk data");
      logger.info("Aimed url: " + this.serviceUrl);

      // Test if there is something inside the response
      var isBodyEmpty = isEmpty(body) || (body === "[]");
      if (isBodyEmpty) {
        logger.info("No new tickets.");
        signal = null;
      }
      else {
        logger.info("Get an update from Mojo API");
        for (let section of body) {
          let ticket = section.ticket;
          let assignedId = ticket.assigned_to_id;
          if (this.config.option == "nuoatatm") {
            this.url = `https://${this.domain}/ma/#/tickets/search?sort_field=updated_on&assignee_id=${assignedId}&status_id=10,20,30,40&page=1`;
          }
        }
        signal = new q.Signal({
          points: [[new q.Point(this.config.color, this.config.effect)]],
          name: "Mojo Helpdesk",
          message: this.message,
          link: {
            url: this.url,
            label: 'Show in Mojo Helpdesk',
          }
        });
        this.updateUrlWithRightTime();
        logger.info("serviceUrl AFTER UPDATE in run function: " + this.serviceUrl);
        return signal;
      }
    }
    catch (error) {
      logger.error(`Got error sending request to service: ${JSON.stringify(error)}`);
      return q.Signal.error([
        'The Mojo Helpdesk service returned an error. Please check your API key and account.',
        `Detail: ${error.message}`
      ]);
    }

  }

}

module.exports = {
  MojoHelpdesk: MojoHelpdesk,
};

const mojoHelpdesk = new MojoHelpdesk();