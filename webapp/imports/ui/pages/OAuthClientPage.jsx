// Here's the OAuth/protected FHIR server: https://open-ic.epic.com/Argonaut/api/FHIR/Argonaut, 
// Its Conformance statement is here: https://open-ic.epic.com/Argonaut/api/FHIR/Argonaut/metadata 
// And its authorize endpoint: https://open-ic.epic.com/FHIR/oauth2/authorize
// ARGONAUT/ARGONAUT
// https://guide.meteor.com/accounts.html#oauth-calling-api  


//====================================
// Client Config
//
// Epic
// 2098c6e8-57c3-6b87-a5f2-8712d49365f9
// https://open-ic.epic.com/argonaut/api/FHIR/Argonaut/
// https://open-ic.epic.com/FHIR/oauth2/authorize


// Not sure how functional the following sandbox is
// https://open-ic.epic.com/Argonaut/api/FHIR/Argonaut/

// username:  fhirjson
// password:  epicepic1

// http://motorcycleguy.blogspot.com/2015/09/my-fhir-json-xml-converter-in.html
// https://github.com/kwboone/FHIR-JSON-to-XML-Converter/blob/master/FHIR%20JSON%20to%20XML%20Converter/src/FHIRConverterBody.js





import React from 'react';
import { ReactMeteorData } from 'meteor/react-meteor-data';
import ReactMixin from 'react-mixin';

import { AboutAppCard } from '/imports/ui/components/AboutAppCard';
import { VerticalCanvas, GlassCard, DynamicSpacer } from 'meteor/clinical:glass-ui';
import { CardHeader, CardText, CardTitle, CardActions, TextField, Toggle, Paper, FlatButton, RaisedButton } from 'material-ui';
import { Grid, Row, Col, Table } from 'react-bootstrap';
import { ReactiveVar } from 'meteor/reactive-var';

import { Promise } from 'meteor/promise';
import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';

import { PatientDetail, PatientTable } from 'meteor/clinical:hl7-resource-patient';

// import Fhir from 'fhir';

import { get } from 'lodash';
// import { parseString } from 'xml2js';

// var fhir = new Fhir();

var getUserIdResult = new ReactiveVar(null);
var getUserData = new ReactiveVar(null);
var getPatientData = new ReactiveVar(null);

const defaultOAuthState = {
    conformance: {},
    fhirVersion: '',
    formData: {
      serviceName: 'SmartOnFhir',
      clientId: '',
      secretKey: Meteor.uuid(),
      targetBaseUrl: '',
      targetLoginUrl: '',
      tokenUrl: '',
      loginStyle: 'popup'
    },
    autoscan: '',
    metadata: '',
    baseUrl: 'https://open-ic.epic.com/Argonaut/api/FHIR/Argonaut',
    authorizeUrl: '',
    tokenUrl: '',
    patientSearch: {
        text: '',
        given: '', 
        family: '',
        gender: '',
        birthdate: '',
        identifier: ''
    },
    patientData: ''
  };

export class OAuthClientPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = defaultOAuthState;
  }
  componentDidMount() {
      this.setState(defaultOAuthState);
  }


          

        
  getMeteorData() {

    let data = {
      style: {},
      state: defaultOAuthState,
      services: []
    };

    if(ServiceConfiguration){
        data.services = ServiceConfiguration.configurations.find().fetch()
    }   


    // data.state.formData.clientId: get(Meteor, 'settings.private.oAuth.epic.clientId');
    // data.state.formData.secretKey: get(Meteor, 'settings.private.oAuth.epic.secretKey');
    // data.state.formData.clientId: get(Meteor, 'settings.private.oAuth.google.clientId');
    // data.state.formData.secretKey: get(Meteor, 'settings.private.oAuth.google.secretKey');

    data.state.userAccessToken = getUserAccessToken();
    data.state.userIdResult = getUserIdResult.get();
    data.state.userOAuth2Id = get(Meteor.user(), 'services.OAuth2Server.id');
    data.state.userData = EJSON.stringify(getUserData.get(), {indent: 2});
    data.state.patientData = EJSON.stringify(getPatientData.get(), {indent: 2});

    return data;
  }
  render(){
    let baseUrl = Meteor.absoluteUrl();
    let path = "_oauth/" + this.state.formData.serviceName;
    let oAuthPath = baseUrl + path;
    let serviceName = this.state.formData.serviceName;
    let accessToken = this.state.accessToken;
    let tableRows = [];
    let signInWiths = [];

    for (var i = 0; i < this.data.services.length; i++) {
        tableRows.push(
            <tr key={i} className="servicesRow" style={{cursor: "pointer"}}>

              <td className='service' style={{minWidth: '100px', paddingTop: '16px'}}>{this.data.services[i].service }</td>
              <td className='clientId' style={this.data.style.cell}>{this.data.services[i].clientId }</td>
              <td className='secret' style={this.data.style.cell}>{this.data.services[i].secret}</td>
              <td className='baseUrl' style={this.data.style.cell}>{this.data.services[i].baseUrl}<br/>{this.data.services[i].loginUrl}</td>
              <td className='pluginStyle' style={this.data.style.cell}>{this.data.services[i].pluginStyle}</td>
            </tr>
            );
    }
    for (var j = 0; j < this.data.services.length; j++) {
        signInWiths.push(
            <div key={j}>
              <RaisedButton 
                label={ 'Sign in with ' + this.data.services[j].service } 
                id={ this.data.services[j].service + "Button" }
                primary={true}
                onClick={ this.signInWith.bind(this, this.data.services[j].service) }
                fullWidth
                />    
                <br />
                <br />
            </div>
        );
    }    

    return(
        
      <div id="OAuthClientPage">
        <VerticalCanvas >




            <GlassCard width='768px' zDepth={2} >
                <CardTitle
                    title='0.  Autoscan FHIR Server'
                    subtitle='The following button will scan a FHIR Server and autodetect and configure the OAuth connection, based on the FHIR conformance statement located at <code>/metadata</code>' />
                <CardText>
                    <Grid>
                        <Row>
                            <Col md={6}>
                                <TextField
                                    type="text"
                                    ref="url"
                                    name="url"
                                    floatingLabelText="Url"
                                    hintText="https://open-ic.epic.com/Argonaut/api/FHIR/Argonaut/"
                                    value={ this.state.baseUrl }
                                    onChange={ this.updateBaseUrl.bind(this) }
                                    fullWidth
                                />      
                           </Col>
                        </Row>
                        <Row>
                            <Col md={12}>
                                <pre style={{ overflowY: 'scroll', height: '250px' }}>
                                    { this.state.metadata }
                                </pre>
                            </Col>
                        </Row>
                    </Grid>                    
                </CardText>
                <CardActions>
                    <FlatButton 
                        label="Autoscan" 
                        id="autoscanButton" 
                        onClick={ this.autoscan.bind(this) }
                        primary={false} />
                </CardActions>
            </GlassCard>
            <DynamicSpacer />



            <GlassCard width='768px' zDepth={2} >
                <CardTitle
                    title='1.  Autoconfig Values'
                    subtitle='' />
                <CardText>
                    <Grid>
                        <Row>
                            <Col md={5}>
                                <TextField
                                    type="tokenUrl"
                                    ref="tokenUrl"
                                    name="tokenUrl"
                                    floatingLabelText="Token"
                                    hintText="https://open-ic.epic.com/Argonaut/oauth2/token"
                                    floatingLabelFixed={true}
                                    value={ this.state.tokenUrl }
                                    fullWidth
                                />      
                           </Col>
                            <Col md={5}>
                                <TextField
                                    type="authorizeUrl"
                                    ref="authorizeUrl"
                                    name="authorizeUrl"
                                    floatingLabelText="Authorize"
                                    hintText="https://open-ic.epic.com/Argonaut/oauth2/authorize"
                                    floatingLabelFixed={true}
                                    value={ this.state.authorizeUrl }
                                    fullWidth
                                />      
                            </Col>
                            <Col md={2}>
                                <TextField
                                    type="fhirVersion"
                                    ref="fhirVersion"
                                    name="fhirVersion"
                                    floatingLabelText="FhirVersion"
                                    hintText="1.0.2"
                                    floatingLabelFixed={true}
                                    value={ this.state.fhirVersion }
                                    fullWidth
                                />      
                            </Col>
                        </Row>
                    </Grid>
                               
                </CardText>
                <CardActions>
                    <FlatButton 
                        label="Autoconfig Values" 
                        id="autoscanButton" 
                        onClick={ this.extractAutoconfigValues.bind(this) }
                        primary={false} />
                    
                </CardActions>
            </GlassCard>
            <DynamicSpacer />            



           <GlassCard width='768px' zDepth={2} >
                <CardTitle
                    title='2.  Name this Service'
                    subtitle='Who are you signing a Business Associate Agreement with?  Who operates this OAuth server?'
                />
                <CardText>
                    <Grid>
                        <Row>
                            <Col md={6}>
                                <TextField
                                    type="service"
                                    ref="service"
                                    name="service"
                                    floatingLabelText="Service Name"
                                    hintText="epic, facebook, google, twitter, OAuth2Server, FhirVault, SmartOnFhir, etc"
                                    floatingLabelFixed={true}
                                    onChange={ this.editServiceName.bind(this, 'serviceName')}
                                    defaultValue='SmartOnFhir'
                                    fullWidth
                                />      
                           </Col>
                        </Row>
                    </Grid>
                </CardText>
            </GlassCard>
            <DynamicSpacer />


          <GlassCard width='768px' zDepth={2}>

            <CardTitle
                title='3. Register This App With Resource Provider' />
            <CardText>
                <p>
                    If you operate the AuthenticationServer, you can add a client by directly editing it's database.  In a production environment, this entry would be generated by an admin console or a client API KeyRequestPage. 
                </p>
                <p>
                If you do not operate the resource owner, then you must contact the service in some way to get the keys.  This step may require business agreements, online registration, agreement to terms and services, license or subscription fees, service level agreements, background checks, insurance policies, security audits, and other technical due diligence.  
                </p>
                <p>
                   When ready, the AuthenticationServer will need the following Redirect URI.  This URI is environment specific.  If you deploy to staging, testing, production, etc. you will need to update this URI on the Authorization Server, or you will need to create a second app.   
                </p>

                <h3 style={{width: '100%', textAlign: 'center'}}>{oAuthPath}</h3>
            </CardText>
          </GlassCard>
        <DynamicSpacer />


          <GlassCard width='768px' zDepth={2} >
            <CardTitle
                title='4.  Configure This Application' 
                subtitle={<a href="https://github.com/meteor/meteor/wiki/OAuth-for-mobile-Meteor-clients#loginStyle-vepopuprsus-redirect-flow">OAuth for mobile Meteor clients</a>}
                />
            <CardText>
                    <Row>
                        <Col md={6}>
                            <TextField
                                type="text"
                                ref="serviceName"
                                name="akyKey"
                                floatingLabelText="Service Name"
                                floatingLabelFixed={true}
                                hintText="facebook, github, epic, etc."
                                onChange={ this.editServiceName.bind(this, 'serviceName')}
                                value={ this.state.formData.serviceName }
                                fullWidth
                            />       
                            <TextField
                                type="text"
                                ref="clientId"
                                name="akyKey"
                                floatingLabelText="API Key (ClientID)"
                                floatingLabelFixed={true}
                                hintText="2dd874fc-94a4-45f3-9acb-b3d865f82b54"
                                onChange={ this.editclientId.bind(this, 'clientId')}
                                fullWidth
                            />       

                            <TextField
                                type="text"
                                ref="secretKey"
                                name="secretKey"
                                floatingLabelText="Secret Key"
                                floatingLabelFixed={true}
                                hintText={ this.state.formData.secretKey }
                                defaultValue={ this.state.formData.secretKey }
                                onChange={ this.editSecretKey.bind(this, 'secretKey') }
                                fullWidth
                            />       
                        </Col>
                        <Col md={6}>
                            <TextField
                                type="text"
                                ref="targetBaseUrl"
                                name="targetBaseUrl"
                                floatingLabelText="Target Base URL"
                                floatingLabelFixed={true}
                                hintText="http://localhost:3100"
                                onChange={ this.editTargetBaseUrl.bind(this, 'targetBaseUrl') }
                                value={ this.state.formData.targetBaseUrl }
                                fullWidth
                            />       
                            <TextField
                                type="text"
                                ref="targetLoginUrl"
                                name="targetLoginUrl"
                                floatingLabelText="Target Login URL"
                                floatingLabelFixed={true}
                                hintText="http://localhost:3100/oauth"
                                onChange={ this.editTargetLoginUrl.bind(this, 'targetLoginUrl') }
                                value={ this.state.formData.targetLoginUrl }
                                fullWidth
                            />       
                            <br />
                            <br />
                            <Toggle
                                label="loginStyle"
                                ref="loginStyle"
                                name="loginStyle"
                                labelPosition="right"
                                defaultToggled={true}
                                onChange={ this.editloginStyle.bind(this, 'loginStyle')}
                                style={{float: 'right'}}
                            />
                        </Col>
                    </Row>
                </CardText>
                <CardActions>
                    <FlatButton 
                            label="Save Configuration" 
                            id="saveConfigurationButton" 
                            onClick={ this.saveConfiguration.bind(this) }
                            primary={false} />
                </CardActions>
            </GlassCard>
            <DynamicSpacer />



            <GlassCard width='768px' zDepth={2} >
                <CardTitle
                    title='5.  Authorization Services'

                />
                <CardText>
                    <Table>
                        <thead>
                            <tr>
                                <th className='service' style={{minWidth: '100px'}}>service</th>
                                <th className='clientId' style={{minWidth: '100px'}}>clientId</th>
                                <th className='secret' style={{minWidth: '100px'}}>secret</th>
                                <th className='baseUrl' style={{minWidth: '100px'}}>baseUrl</th>
                                <th className='style' style={{minWidth: '100px'}}>style</th>
                            </tr>
                        </thead>
                        <tbody>
                            { tableRows }
                        </tbody>
                    </Table>
                </CardText>
                <CardActions>
                    <FlatButton 
                        label="Resync Configuration" 
                        id="resyncConfiguration" 
                        primary={false} 
                        onClick={ this.resyncConfiguration.bind(this) }
                        style={{float: 'right'}}
                        />

                </CardActions>            
              </GlassCard>
            <DynamicSpacer />




            <GlassCard width='768px' zDepth={2} >
                <CardTitle
                    title='6.  Sign In'

                />
                <CardText>
                    <Grid>
                        <Row>
                            <Col md={4}>
                                <TextField
                                    type="username"
                                    ref="username"
                                    name="username"
                                    floatingLabelText="Username"
                                    hintText="janedoe"
                                    floatingLabelFixed={true}
                                    fullWidth
                                />      
                           </Col>
                            <Col md={4}>
                                <TextField
                                    type="password"
                                    ref="password"
                                    name="password"
                                    floatingLabelText="Password"
                                    hintText="********"
                                    floatingLabelFixed={true}
                                    fullWidth
                                />      
                            </Col>
                            <Col md={4}>
                                { signInWiths }
                            </Col>
                        </Row>
                    </Grid>
                </CardText>
            </GlassCard>
            <DynamicSpacer />


            <GlassCard width='768px' zDepth={2} >
                <CardTitle
                    title='7.  Access Token'
                    subtitle='The following button will scan a FHIR Server and autodetect and configure the OAuth connection, based on the FHIR conformance statement located at <code>/metadata</code>' />
                <CardText style={{textAlign: 'center'}}>
                    <h3 style={{width: '100%', textAlign: 'center'}}>{accessToken}</h3>
                </CardText>
            </GlassCard>
            <DynamicSpacer />










            <GlassCard width='768px' zDepth={2} >
                <CardTitle
                    title='8.  Search Patients'                    
                    subtitle={<span style={{color: 'rgb(38, 166, 154)'}}> { this.state.baseUrl + '/Patient/Tbt3KuCY0B5PSrJvCu2j-PlK.aiHsu2xUjUM8bWpetXoB' } </span>} />
                    {/* subtitle={<span style={{color: 'rgb(38, 166, 154)'}}> https://open-ic.epic.com/FHIR/api/FHIR/DSTU2/Patient/Tbt3KuCY0B5PSrJvCu2j-PlK.aiHsu2xUjUM8bWpetXoB </span>} /> */}
                <CardText> 
                    <Grid>
                        <Row>
                            
                            <br />
                        </Row>
                        <Row>
                            <Col md={6}>
                                <TextField
                                    type="text"
                                    ref="name"
                                    name="name"
                                    floatingLabelText="Full Name"
                                    hintText="Jane Doe"
                                    floatingLabelFixed={true}
                                    fullWidth
                                />      
                            </Col>
                            <Col md={2}>
                              <TextField
                                    type="text"
                                    ref="birthdate"
                                    name="birthdate"
                                    floatingLabelText="Birthdate"
                                    hintText="1960-01-01"
                                    floatingLabelFixed={true}
                                    fullWidth
                                />    
                            </Col>                            
                            <Col md={2}>
                                <TextField
                                    type="text"
                                    ref="gender"
                                    name="gender"
                                    floatingLabelText="Gender"
                                    hintText="female"
                                    floatingLabelFixed={true}
                                    fullWidth
                                />      
                            </Col>
                            <Col md={2}>
                                <TextField
                                    type="text"
                                    ref="identifier"
                                    name="identifier"
                                    floatingLabelText="Identifier"
                                    hintText="12345"
                                    floatingLabelFixed={true}
                                    fullWidth
                                />      
                            </Col>                              
                        </Row>
                        <Row>
                            <Col md={3}>
                                <TextField
                                    type="text"
                                    ref="given"
                                    name="given"
                                    floatingLabelText="Given"
                                    hintText="Jane"
                                    floatingLabelFixed={true}
                                    fullWidth
                                />      
                            </Col>
                            <Col md={3}>
                                <TextField
                                    type="text"
                                    ref="family"
                                    name="family"
                                    floatingLabelText="Family"
                                    hintText="Doe"
                                    floatingLabelFixed={true}
                                    fullWidth
                                />      
                            </Col>
                        
                        </Row>
                    </Grid>


                </CardText>
                <CardActions>
                  <FlatButton 
                        label="Search" 
                        id="searchPatients" 
                        onClick={this.searchPatients.bind(this)}
                        primary={false} />
                </CardActions>
          </GlassCard>
          <DynamicSpacer />

          <GlassCard width='768px' zDepth={2} >
            <CardTitle
                title='9.  Patient Data!' />
            <CardText>
                <Row>
                    <Col md={12}>
                        <pre style={{ overflowY: 'scroll', height: '250px' }}>
                            { this.state.patientData }
                        </pre>
                    </Col>
                </Row>
            </CardText>
          </GlassCard>
          <DynamicSpacer />


          <GlassCard width='768px' zDepth={2} >
            <CardTitle
                title='10.  Patient Detail Card' />
            <CardText>
                <PatientDetail />
            </CardText>
          </GlassCard>
          <DynamicSpacer />


          <GlassCard width='768px' zDepth={2} >
            <CardTitle
                title='11.  Patient Table' />
            <CardText>
                   <PatientTable
                        data={[]} />
            </CardText>
          </GlassCard>
          <DynamicSpacer />


          <DynamicSpacer />
        </VerticalCanvas>
      </div>
    );
  }
  
  editServiceName(field, event, value){
    //console.log('editclientId', value)
    var newFormData = this.state.formData;
    newFormData.serviceName = value;

    this.setState({
        'formData': newFormData
    });
  }
  editclientId(field, event, value){
    //console.log('editclientId', value)
    var newFormData = this.state.formData;
    newFormData.clientId = value;

    this.setState({
        'formData': newFormData
    });
  }
  editSecretKey(field, event, value){
    //console.log('editSecretKey', value)

    var newFormData = this.state.formData;
    newFormData.secretKey = value;
    
    this.setState({
        'formData': newFormData
    });
  }
  editTargetBaseUrl(field, event, value){
    //console.log('editTargetBaseUrl', value)

    var newFormData = this.state.formData;
    newFormData.targetBaseUrl = value;
    
    this.setState({
        'formData': newFormData
    });
  }
  editTargetLoginUrl(field, event, value){
    //console.log('editTargetLoginUrl', value)

    var newFormData = this.state.formData;
    newFormData.targetLoginUrl = value;
    
    this.setState({
        'formData': newFormData
    });
  }
  editloginStyle(fipopupeld, event, value){
    //console.log('editloginStyle - ß', value)
    
    var newFormData = this.state.formData;
    newFormData.loginStyle = value;
    
    this.setState({
        'formData': newFormData
    });
  }


  
  changeState(field, event, value){
    const formData = this.state.formData;
    formData[field] = value;
    this.setState({
        formData: formData
    });
  }
  updateBaseUrl(field, event, value){
    this.setState({
        'baseUrl': value
    });
  }
  
  saveConfiguration(){
    console.log('saveConfiguration', this.state);

    Meteor.call('configureOauthService', this.state.formData);
  }
  autoscan(){
      console.log('autoscan')
      var self = this;

      HTTP.get(this.state.baseUrl + '/metadata?_format=application/json', function(error, result){
          if(error){
              console.log('error', error)
          }
          if(result){
              console.log(result.content);
              var conformanceStatement = JSON.parse(result.content);
              console.log('conformanceStatement', conformanceStatement)
              self.setState({
                  metadata: EJSON.stringify(conformanceStatement, {indent: 2}),
                  conformance: conformanceStatement
              })
        }
      })
  }
  clearAutoscan(){
    self.setState({
        metadata: ''
    })
  }
  extractAutoconfigValues(){
      console.log('extractAutoconfigValues', this.state)

      var newState = {
        fhirVersion:  get(this, 'state.conformance.fhirVersion'),
        authorizeUrl:  '',
        tokenUrl: '',
        formData: {
            serviceName: this.state.formData.serviceName,
            secretKey: this.state.formData.secretKey,
            loginStyle: this.state.formData.loginStyle,
            targetBaseUrl: this.state.baseUrl,
            tokenUrl: this.state.formData.tokenUrl,
            targetLoginUrl: ''
        }
      }

    // json doesn't we don't actually know the ordering of 
    var oauthExtension = get(this, 'state.conformance.rest[0].security.extension[0].extension');

    console.log('oauthExtension', oauthExtension);

    oauthExtension.forEach(function(object){
        console.log('object', object)
        if(object.url == "authorize") {
            newState.authorizeUrl = object.valueUri;
            newState.formData.targetLoginUrl = object.valueUri;
        }
        if(object.url == "token"){
            newState.tokenUrl = object.valueUri            
            newState.formData.tokenUrl = object.valueUri;
        }
    });

    console.log('newState', newState)
    this.setState(newState)



    // // don't know if we need this.  Probably not.  
    // 
    // var newMethodName = 'loginWith' + newState.formData.serviceName
    // Meteor[newMethodName] = function (options, callback) {
    //     if (!callback && typeof options === "function") {
    //         callback = options;
    //         options = null;
    //     }

    //     var credentialRequestCompleteCallback = Accounts.oauth.credentialRequestCompleteHandler(callback);
    //     OAuth2.requestCredential(options, credentialRequestCompleteCallback);
    // };

  }
  signInWith(service){
    console.log('signInWith', service)
    var options = {
          requestPermissions: [
            'OBSERVATION.READ', 
            'OBSERVATION.SEARCH', 
            'PATIENT.READ', 
            'PATIENT.SEARCH', 
            'PRACTITIONER.READ', 
            'PRACTITIONER.SEARCH',
            'patient/*.read',
            'patient/*.search',
            'openid'
          ]
        }

        console.log('Accounts.oauth.serviceNames', Accounts.oauth.serviceNames());

        //console.log('Accounts.oauth.credentialRequestCompleteHandler()');
        var credentialRequestCompleteCallback = Accounts.oauth.credentialRequestCompleteHandler(function(error, result){
            console.log('foo?')
            console.log('error', error)
            console.log('result', result)
            console.log('foo!')            
        });

        //console.log('credentialRequestCompleteCallback', credentialRequestCompleteCallback)
        OAuth2.requestCredential(options, credentialRequestCompleteCallback);



        // OAuth2.requestCredential(
        //     options, 
        //     Accounts.oauth.credentialRequestCompleteHandler(function(error, result){
        //         console.log('foo?')
        //         console.log('error', error)
        //         console.log('result', result)
        //         console.log('foo!')
                
        //     })
        // );

    
        // Meteor.loginWithFhirVault({requestPermissions: [ 'email' ]}, function(err){
        //     if(!err) {
        //         Router.go('/');
        //     } else {
        //         console.log(err)
        //     }
            
        // });

  }
  resyncConfiguration(){
    console.log('Resyncing Configuration')
    console.log('this.state', this.state)

    console.log('Existing services:  ', Accounts.oauth.serviceNames())

    if (Accounts.oauth.serviceNames().includes(this.state.formData.serviceName)){
        console.log('Found an old registration of ' + this.state.formData.serviceName + '.  Removing...')
        Accounts.oauth.unregisterService(this.state.formData.serviceName)
    }

    console.log('Recreating service:  ', this.state.formData.serviceName)
    Accounts.oauth.registerService(this.state.formData.serviceName)
  }
  resetServiceConfiguration(){
    console.log('resetServiceConfiguration')
  }
  searchPatients(){
    console.log('searchPatients')
    //alert('searchPatients')
    var self = this    
    var formatString = '?_format=application/json';
    var baseUrl = 'https://open-ic.epic.com/FHIR/api/FHIR/DSTU2/Patient/Tbt3KuCY0B5PSrJvCu2j-PlK.aiHsu2xUjUM8bWpetXoB';
    HTTP.get(baseUrl + formatString, function(err, result){
        if(result){
            console.log(JSON.parse(result.content));

            var patientData = JSON.parse(result.content);
            console.log('patientData', patientData)
            self.setState({
                patientData: EJSON.stringify(patientData, {indent: 2}),
                patient: patientData
            })


        }
    });
  

  }
}




/**
 * Determine if a user originates from an oauth2 login.
 * @param user
 * @returns {*}
 */
function isOAuth2User(user) {
    return get(user, 'services.OAuth2Server');
  }
  
/**
 * Get the user access token if it exists.
 * @returns {*}
 */
function getUserAccessToken() {
    var user = Meteor.user();

    if (!isOAuth2User(user)) {
        return;
    }

    return user.services.OAuth2Server.accessToken;
}


ReactMixin(OAuthClientPage.prototype, ReactMeteorData);
export default OAuthClientPage;