# sails-graphql-client

Very simple GraphQL client for sails app. Use it with [sails-graphql-adapter](https://github.com/arvitaly/sails-graphql-adapter)

[![Build Status](https://travis-ci.org/arvitaly/sails-graphql-client.svg?branch=master)](https://travis-ci.org/arvitaly/sails-graphql-client)
[![npm version](https://badge.fury.io/js/sails-graphql-client.svg)](https://badge.fury.io/js/sails-graphql-client)
[![unstable](http://badges.github.io/stability-badges/dist/unstable.svg)](http://github.com/badges/stability-badges)
[![Coverage Status](https://coveralls.io/repos/github/arvitaly/sails-graphql-client/badge.svg?branch=master)](https://coveralls.io/github/arvitaly/sails-graphql-client?branch=master)

# Install

    npm install sails-graphql-client --save

# API

    request(q, vars?): Promise<any>

    watchRequest(q, vars?, opts?: { pollingTimeout?: number }): IOneEmitter<any> //usage with [onemitter](https://github.com/arvitaly/onemitter)

# Example

    //Create mutation
    await client.request(`
        mutation M1{ 
            createUser( input: {firstName: "Ni"} ){ 
                user{
                    id
                } 
            } 
        }`);
    // { createUser: {user: { id : 15 }} }
    
        const handle = (data)=>{
            // {user:{firstName: "John" }}
        }
        client.watchRequest(`
            query Q1{ 
                user(
                    firstNameContains:"Jo"
                    ){ 
                        firstName 
                    } 
                }`, {},{ pollingTimeout: 50 })(handle);



