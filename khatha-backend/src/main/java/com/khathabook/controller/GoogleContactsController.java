	package com.khathabook.controller;
	
	import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
	import com.google.api.client.json.jackson2.JacksonFactory;
	import com.google.api.services.people.v1.PeopleService;
	import com.google.api.services.people.v1.model.*;
	import com.google.api.client.http.HttpRequestInitializer;
	import com.google.auth.http.HttpCredentialsAdapter; 
	import com.google.auth.oauth2.AccessToken;
	import com.google.auth.oauth2.GoogleCredentials;
	
	import org.springframework.http.ResponseEntity;
	import org.springframework.web.bind.annotation.*;
	
	import java.util.*;
	
	@RestController
	@RequestMapping("/api/contacts")
	@CrossOrigin(origins = "http://localhost:5173")
	public class GoogleContactsController {
	
	    @PostMapping("/google")
	    public ResponseEntity<?> getGoogleContacts(@RequestBody Map<String, String> body) {
	
	        try {
	            String accessToken = body.get("accessToken");
	
	            if (accessToken == null) {
	                return ResponseEntity.badRequest().body("Access token missing");
	            }
	
	            GoogleCredentials credentials =
	                    GoogleCredentials.create(new AccessToken(accessToken, null));
	
	            HttpRequestInitializer requestInitializer =
	                    new HttpCredentialsAdapter(credentials);
	
	            PeopleService peopleService = new PeopleService.Builder(
	                    GoogleNetHttpTransport.newTrustedTransport(),
	                    JacksonFactory.getDefaultInstance(),
	                    requestInitializer
	            ).setApplicationName("Khatha Wallet").build();
	
	            ListConnectionsResponse response = peopleService.people().connections()
	                    .list("people/me")
	                    .setPersonFields("names,emailAddresses")
	                    .execute();
	
	            List<Map<String, String>> contactsList = new ArrayList<>();
	
	            if (response.getConnections() != null) {
	                for (Person person : response.getConnections()) {
	
	                    String name = "";
	                    String email = "";
	
	                    if (person.getNames() != null && !person.getNames().isEmpty()) {
	                        name = person.getNames().get(0).getDisplayName();
	                    }
	
	                    if (person.getEmailAddresses() != null && !person.getEmailAddresses().isEmpty()) {
	                        email = person.getEmailAddresses().get(0).getValue();
	                    }
	
	                    if (!email.isEmpty()) {
	                        Map<String, String> contact = new HashMap<>();
	                        contact.put("name", name);
	                        contact.put("email", email);
	                        contactsList.add(contact);
	                    }
	                }
	            }
	
	            return ResponseEntity.ok(contactsList);
	
	        } catch (Exception e) {
	            e.printStackTrace();
	            return ResponseEntity.status(500).body("Failed to fetch contacts");
	        }
	    }
	}
