describe('Note app', function() {
  beforeEach(function(){
    cy.request('POST', `${Cypress.env('BACKEND')}/testing/reset`)
    const user = {
      name:'Kien Nguyen',
      username:'kien',
      password:'password'
    }
    cy.request('POST', `${Cypress.env('BACKEND')}/users`,user)
    cy.visit('')
  })

  it('login fails with wrong password',function(){
    cy.contains('log in').click()
    cy.get('#username').type('kien')
    cy.get('#password').type('random hihi')
    cy.get('#login-button').click()
    
    cy.get('.error').should('contain','Wrong Credentials')
                    .and('have.css','color','rgb(255, 0, 0)')
                    .and('have.css','border-style','solid')

    cy.get('html').should('not.contain','Kien Nguyen logged in')
  })

  it('front page can be opened', function(){
    cy.contains('Notes')
    cy.contains('Note app')
  })

  describe('when logged in', function(){
    beforeEach(function(){
      cy.login({username:'kien',password:'password'})
    })  
    
    it('a new note can be created', function() {
      cy.contains('new note').click()
      cy.get('input').type('a note created by cypress')
      cy.contains('save').click()
    })
    
    describe('and a several note exists', function(){
      beforeEach(function(){
        cy.createNote({content:'first note',important:false})
        cy.createNote({content:'second note',important:false})
        cy.createNote({content:'third note',important:false})
      })

      it('one of the notes can be made important', function(){
        cy.contains('second note')
          .contains('make important')
          .click()
        
        cy.contains('second note')
          .contains('make not important')
      })
    })

    
  })
  
})

