import React from 'react';
import styles from './Contact.css';

function Contact() {
    return (
        <div className={styles.background}>
            <p style={{ color: 'white', fontSize: '14px' }}>
                To report any bugs or issues, please send an email to the following email address with a screenshot of the issue.
                <br/><br/>
                CONTACT:<br/>
                vantimes.info@gmail.com
                <br/><br/>
                Vancouver DEV Times
            </p>
        </div>
    );
}

export default Contact;