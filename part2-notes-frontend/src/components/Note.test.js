import React from "react";
import '@testing-library/jest-dom'
import {render,screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Note from './Note'

test('render content', async ()=> {
    const note = {
        content: 'Component testing is done with react-testing-library',
        important: true
    }

    const mockHandler = jest.fn()

    const {container} = render(<Note note={note} toggleImportance={mockHandler}/>)  

    const div = container.querySelector('.note')

    const user = userEvent.setup()
    const button = screen.getByText('make not important')
    await user.click(button)

    expect(mockHandler.mock.calls).toHaveLength(1)
})