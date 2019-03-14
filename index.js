// Library to send signal to Q keyboards
const q = require('daskeyboard-applet');

// Library to send request to API
const request = require('request-promise');

const logger = q.logger;

const serviceUrl = 'http://mysupport.mojohelpdesk.com/api/tickets?access_key=98d98ea4bf8495561dea27b8a45e83c5bbf53c16';

class MojoHelpdesk extends q.DesktopApp {
  constructor() {
    super();
    // run every min
    this.pollingInterval = 60000;
    this.ticketNumberInitial = 0;
    this.ticketNumber = 0;
  }

  async applyConfig() {
    // this.serviceHeaders = {
    //   "Content-Type": "application/json",
    //   "X-API-KEY": this.authorization.apiKey,
    // }
    logger.info("Initialisation. Let's count the initial number ticket.")
    request.get({
      url: serviceUrl,
      json: true
    }).then((body) => {

      // Count the number of intial ticket
      for (let section of body) {
        this.ticketNumberInitial = this.ticketNumberInitial + 1;
      }
      logger.info(`Got ${this.ticketNumberInitial} initial tickets.`)
      
    })
    .catch(error => {
      logger.error(
        `Got error sending request to service: ${JSON.stringify(error)}`);
      return q.Signal.error([
        'The Mojo Helpdesk service returned an error. Please check your API key and account.',
        `Detail: ${error.message}`]);
    });
  }

  // call this function every pollingInterval
  async run() {
    return request.get({
        url: serviceUrl,
        json: true
      }).then((body) => {
        logger.info("Looking for Mojo Helpdesk data");

        // console.log(JSON.stringify(body));

        let color = '#00FF00';
        let triggered = false;
        let effects = "SET_COLOR";
        
        // extract the important values from the response
        for (let section of body) {
          let ticket = section.ticket;
          logger.info(`For ticket ${ticket}`);

          let ticketId = ticket.id;

          this.ticketNumber = this.ticketNumber + 1;


        }

        if(this.ticketNumber != this.ticketNumberInitial){
          logger.info("New ticket.")
          // TO DO
        }
        this.ticketNumberInitial=this.ticketNumber;


      })
      .catch(error => {
        logger.error(
          `Got error sending request to service: ${JSON.stringify(error)}`);
        return q.Signal.error([
          'The Mojo Helpdesk service returned an error. Please check your API key and account.',
          `Detail: ${error.message}`]);
      });
  }

  generatePoints(percent) {
    return [new q.Point(this.getColor(percent))];
  }

  getColor(percent) {
    if (percent < 0 || percent > 1) {
      return '#000000' // Black
    } else {
      return '#ffffff'
    }
  }

}

module.exports = {
  MojoHelpdesk: MojoHelpdesk,
};

const mojoHelpdesk = new MojoHelpdesk();